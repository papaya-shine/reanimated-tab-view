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
import type { FlatListProps } from 'react-native';
import { useScrollHandlers } from '../../hooks/scrollable/useScrollHandlers';
import { usePropsContext } from '../../providers/Props';
import { useCollapsibleContext } from '../../providers/Collapsible';
import { useInternalContext } from '../../providers/Internal';

/**
 * RTVFlatList - FlatList component for use within TabView
 * 
 * In COLLAPSIBLE mode:
 * - scrollEnabled={false} - outer ScrollView handles all gestures
 * - Reports content height to context (keyed by route)
 * - Syncs scroll position from outer scroll via useAnimatedReaction
 * - Viewport height comes from parent container, NOT from FlatList's onLayout
 *   (because with scrollEnabled={false}, FlatList expands to fit content)
 * - onEndReached is triggered manually based on outer scroll position
 * 
 * In STATIC mode:
 * - Normal scrolling behavior
 * - Can have its own RefreshControl
 */
function RTVFlatListInner<T>(
  props: FlatListProps<T> & { routeKey?: string },
  ref: React.ForwardedRef<Animated.FlatList<T>>
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
    ...restProps
  } = props;

  const { renderHeader, refreshing, onRefresh, refreshControlColor } = usePropsContext();
  const { currentRouteIndex, routes } = useInternalContext();

  // Use animated ref for UI thread access
  const flatListAnimatedRef = useAnimatedRef<Animated.FlatList<T>>();
  
  // Regular ref for JS thread operations
  const flatListRef = useRef<Animated.FlatList<T>>(null);
  
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

  const renderScrollComponent = useCallback(
    (scrollViewProps: ScrollViewProps) => {
      return <RTVScrollViewWithoutScrollHandler {...(scrollViewProps as any)} />;
    },
    []
  );

  // Expose ref to parent
  useImperativeHandle(ref, () => flatListRef.current as any);

  // Check if we're in collapsible mode
  const isCollapsibleMode = !!renderHeader;

  // Get collapsible context
  const collapsibleContext = useCollapsibleContext();
  
  // Determine the route key for this FlatList
  // Try explicit prop first, then try to infer from current route
  const routeKey = explicitRouteKey || routes[currentRouteIndex]?.key || 'unknown';
  
  // Register this FlatList with the collapsible context
  useEffect(() => {
    if (isCollapsibleMode && flatListRef.current) {
      collapsibleContext.registerInnerScroll(routeKey, flatListRef.current);
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
  const handleContentSizeChange = useCallback((w: number, h: number) => {
    // Track max height we've ever seen for this FlatList
    if (h > maxContentHeightRef.current) {
      maxContentHeightRef.current = h;
      
      if (isCollapsibleMode) {
        collapsibleContext.setInnerContentHeight(routeKey, h);
      }
    }
    
    // Update shared value for UI thread access
    contentHeightSV.value = h;
    
    onContentSizeChange?.(w, h);
  }, [isCollapsibleMode, onContentSizeChange, collapsibleContext, routeKey, contentHeightSV]);

  // Handle layout - just pass through, don't report viewport
  // (viewport height is determined by parent container, not FlatList)
  const handleLayout = useCallback((event: any) => {
    onLayout?.(event);
  }, [onLayout]);

  // Sync scroll position from outer scroll (collapsible mode only)
  // This runs on UI thread and syncs the inner FlatList scroll position
  useAnimatedReaction(
    () => collapsibleContext.innerScrollY.value,
    (innerY) => {
      'worklet';
      if (isCollapsibleMode) {
        scrollTo(flatListAnimatedRef, 0, innerY, false);
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
    
    onEndReached?.({ distanceFromEnd: 0 });
  }, [onEndReached, routeKey, collapsibleContext.activeRouteKey]);

  // Detect end reached in collapsible mode
  // Since the FlatList has scrollEnabled={false}, the native onEndReached won't fire
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
  const setRefs = useCallback((instance: any) => {
    (flatListRef as React.MutableRefObject<typeof instance>).current = instance;
    (flatListAnimatedRef as unknown as (instance: any) => void)(instance);
  }, [flatListAnimatedRef]);

  // In collapsible mode, don't use custom scroll component
  const scrollComponentProps = isCollapsibleMode
    ? {}
    : { renderScrollComponent: renderScrollComponent as any };

  // Determine RefreshControl (only for static mode)
  let finalRefreshControl: React.ReactElement | undefined = undefined;

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
    <Animated.FlatList
      ref={setRefs}
      {...(restProps as any)}
      {...scrollComponentProps}
      onScroll={isCollapsibleMode ? undefined : handleScroll as any}
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

export const RTVFlatList = React.memo(forwardRef(RTVFlatListInner)) as <T>(
  props: FlatListProps<T> & {
    ref?: ForwardedRef<Animated.FlatList<T>>;
    routeKey?: string;
  }
) => ReturnType<typeof RTVFlatListInner>;
