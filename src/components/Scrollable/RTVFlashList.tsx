import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useEffect,
  type ForwardedRef,
} from 'react';
import { type ScrollViewProps, RefreshControl } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { RTVScrollViewWithoutScrollHandler } from './RTVScrollView';
import { FlashList, type FlashListProps } from '@shopify/flash-list';
import { useScrollHandlers } from '../../hooks/scrollable/useScrollHandlers';
import { usePropsContext } from '../../providers/Props';
import { useCollapsibleContext } from '../../providers/Collapsible';
import { useInternalContext } from '../../providers/Internal';

// Create animated version of FlashList for UI thread scroll sync
const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList as React.ComponentClass<FlashListProps<unknown>>
) as typeof FlashList;

/**
 * RTVFlashList - High-performance FlashList component for use within TabView
 *
 * This is a drop-in replacement for RTVFlatList that uses @shopify/flash-list
 * for better performance with large lists and complex items.
 *
 * IMPORTANT: You must provide `estimatedItemSize` prop (required by FlashList)
 *
 * In COLLAPSIBLE mode:
 * - scrollEnabled={false} - outer ScrollView handles all gestures
 * - Reports content height to context (keyed by route)
 * - Syncs scroll position from outer scroll via useAnimatedReaction
 * - Viewport height comes from parent container, NOT from FlashList's onLayout
 *   (because with scrollEnabled={false}, FlashList expands to fit content)
 *
 * In STATIC mode:
 * - Normal scrolling behavior
 * - Can have its own RefreshControl
 */
function RTVFlashListInner<T>(
  props: FlashListProps<T> & { routeKey?: string },
  ref: React.ForwardedRef<FlashList<T>>
) {
  const {
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
    onContentSizeChange,
    onLayout,
    onEndReached,
    onEndReachedThreshold = 0.5,
    refreshControl: userProvidedRefreshControl,
    scrollEnabled: userScrollEnabled = true,
    routeKey: explicitRouteKey,
    estimatedItemSize,
    ...restProps
  } = props;

  // Warn if estimatedItemSize is not provided (FlashList requirement)
  if (__DEV__ && !estimatedItemSize) {
    console.warn(
      'RTVFlashList: estimatedItemSize prop is required for FlashList. ' +
        'Please provide an estimated average height of your list items.'
    );
  }

  const { renderHeader, refreshing, onRefresh, refreshControlColor } =
    usePropsContext();
  const { currentRouteIndex, routes } = useInternalContext();

  // Use animated ref for UI thread access
  const flashListAnimatedRef = useAnimatedRef<FlashList<T>>();

  // Regular ref for JS thread operations
  const flashListRef = useRef<FlashList<T>>(null);

  const maxContentHeightRef = useRef(0);
  
  // Track content height for onEndReached calculation in collapsible mode
  // Using shared value so it can be read on UI thread in useAnimatedReaction
  const contentHeightSV = useSharedValue(0);
  
  // Track viewport height as shared value too
  const viewportHeightSV = useSharedValue(0);
  
  // Debounce onEndReached to prevent multiple rapid calls
  const lastEndReachedTimeRef = useRef(0);
  const END_REACHED_DEBOUNCE_MS = 500;

  const handleScroll = useScrollHandlers({
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
  });

  const renderScrollComponent = useCallback((scrollViewProps: ScrollViewProps) => {
    return <RTVScrollViewWithoutScrollHandler {...(scrollViewProps as any)} />;
  }, []);

  // Expose ref to parent
  useImperativeHandle(ref, () => flashListRef.current as any);

  // Check if we're in collapsible mode
  const isCollapsibleMode = !!renderHeader;

  // Get collapsible context
  const collapsibleContext = useCollapsibleContext();

  // Determine the route key for this FlashList
  // Try explicit prop first, then try to infer from current route
  const routeKey =
    explicitRouteKey || routes[currentRouteIndex]?.key || 'unknown';

  // Register this FlashList with the collapsible context
  useEffect(() => {
    if (isCollapsibleMode && flashListRef.current) {
      collapsibleContext.registerInnerScroll(routeKey, flashListRef.current);
    }
  }, [isCollapsibleMode, collapsibleContext, routeKey]);

  // Sync viewport height to shared value when it changes
  useEffect(() => {
    if (collapsibleContext.contentAreaHeight > 0) {
      viewportHeightSV.value = collapsibleContext.contentAreaHeight;
    }
  }, [collapsibleContext.contentAreaHeight, viewportHeightSV]);

  // Handle content size change - report to context
  // Only report content HEIGHT, not viewport (viewport comes from parent)
  const handleContentSizeChange = useCallback(
    (w: number, h: number) => {
      // Track max height we've ever seen for this FlashList
      if (h > maxContentHeightRef.current) {
        maxContentHeightRef.current = h;

        if (isCollapsibleMode) {
          collapsibleContext.setInnerContentHeight(routeKey, h);
        }
      }
      
      // Update shared value for UI thread access
      contentHeightSV.value = h;

      onContentSizeChange?.(w, h);
    },
    [isCollapsibleMode, onContentSizeChange, collapsibleContext, routeKey, contentHeightSV]
  );

  // Handle layout - just pass through, don't report viewport
  // (viewport height is determined by parent container, not FlashList)
  const handleLayout = useCallback(
    (event: any) => {
      onLayout?.(event);
    },
    [onLayout]
  );

  // Sync scroll position from outer scroll (collapsible mode only)
  // This runs on UI thread and syncs the inner FlashList scroll position
  useAnimatedReaction(
    () => collapsibleContext.innerScrollY.value,
    (innerY) => {
      'worklet';
      if (isCollapsibleMode) {
        scrollTo(flashListAnimatedRef, 0, innerY, false);
      }
    },
    [isCollapsibleMode]
  );

  // Handler for onEndReached callback (called from UI thread via runOnJS)
  // Only triggers if this route is the active route
  const triggerEndReached = useCallback(() => {
    // Check if this is the active route (JS check since activeRouteKey is React state)
    if (collapsibleContext.activeRouteKey !== routeKey) {
      return; // Not active route
    }
    
    const now = Date.now();
    if (now - lastEndReachedTimeRef.current < END_REACHED_DEBOUNCE_MS) {
      return; // Debounce
    }
    lastEndReachedTimeRef.current = now;
    
    // FlashList's onEndReached takes no arguments (unlike FlatList)
    onEndReached?.();
  }, [onEndReached, routeKey, collapsibleContext.activeRouteKey]);

  // Detect end reached in collapsible mode
  // Since the FlashList has scrollEnabled={false}, the native onEndReached won't fire
  // We detect it manually by monitoring the outer scroll position
  // Using shared values so the worklet can read them on the UI thread
  useAnimatedReaction(
    () => ({
      scrollY: collapsibleContext.innerScrollY.value,
      contentH: contentHeightSV.value,
      viewportH: viewportHeightSV.value,
    }),
    (current) => {
      'worklet';
      if (!isCollapsibleMode || !onEndReached) return;
      
      const { scrollY, contentH, viewportH } = current;
      
      // Need valid dimensions
      if (contentH <= 0 || viewportH <= 0) return;
      
      // Calculate distance from end
      const maxScroll = Math.max(0, contentH - viewportH);
      const distanceFromEnd = maxScroll - scrollY;
      const threshold = viewportH * (onEndReachedThreshold ?? 0.5);
      
      // Trigger if we're within threshold of the end
      if (distanceFromEnd <= threshold) {
        runOnJS(triggerEndReached)();
      }
    },
    [isCollapsibleMode, routeKey, onEndReached, onEndReachedThreshold, triggerEndReached]
  );

  // Sync the regular ref to the animated ref
  const setRefs = useCallback(
    (instance: any) => {
      (flashListRef as React.MutableRefObject<typeof instance>).current =
        instance;
      (flashListAnimatedRef as unknown as (instance: any) => void)(instance);
    },
    [flashListAnimatedRef]
  );

  // In collapsible mode, don't use custom scroll component
  const scrollComponentProps = isCollapsibleMode
    ? {}
    : { renderScrollComponent: renderScrollComponent as any };

  // Determine RefreshControl (only for static mode)
  let finalRefreshControl: React.ReactElement | undefined;

  if (!isCollapsibleMode) {
    if (userProvidedRefreshControl) {
      finalRefreshControl = userProvidedRefreshControl;
    } else if (onRefresh) {
      finalRefreshControl = (
        <RefreshControl
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
          tintColor={refreshControlColor}
          colors={refreshControlColor ? [refreshControlColor] : undefined}
        />
      );
    }
  }

  // In collapsible mode: scrollEnabled={false}, outer scroll handles everything
  const effectiveScrollEnabled = isCollapsibleMode ? false : userScrollEnabled;

  return (
    <AnimatedFlashList
      ref={setRefs}
      {...(restProps as any)}
      {...scrollComponentProps}
      estimatedItemSize={estimatedItemSize}
      onScroll={isCollapsibleMode ? undefined : (handleScroll as any)}
      onContentSizeChange={handleContentSizeChange}
      onLayout={handleLayout}
      nestedScrollEnabled={true}
      scrollEnabled={effectiveScrollEnabled}
      refreshControl={finalRefreshControl}
      // Disable bounce when scroll is disabled
      bounces={effectiveScrollEnabled}
      // Show scrollbar only when scrollable
      showsVerticalScrollIndicator={effectiveScrollEnabled}
    />
  );
}

// Export with proper generic typing
// Note: We extend FlashListProps and explicitly include estimatedItemSize
// because TypeScript sometimes has issues with the generic inference
export type RTVFlashListProps<T> = Omit<FlashListProps<T>, 'estimatedItemSize'> & {
  routeKey?: string;
  estimatedItemSize: number;
};

export const RTVFlashList = React.memo(forwardRef(RTVFlashListInner)) as <T>(
  props: RTVFlashListProps<T> & { ref?: ForwardedRef<FlashList<T>> }
) => React.ReactElement | null;

