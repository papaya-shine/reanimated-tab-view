import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  useEffect,
} from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  LogBox,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';

// Suppress the VirtualizedList warning - this is expected in collapsible header patterns
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested inside plain ScrollViews',
]);

import { type TabViewMethods, type TabViewProps } from '../types/TabView';
import type { Layout } from '../types/common';
import { TabBar } from './TabBar';
import TabViewCarousel, { type CarouselImperativeHandle } from './TabViewCarousel';
import { TabLayoutContextProvider } from '../providers/TabLayout';
import { InternalContextProvider } from '../providers/Internal';
import { PropsContextProvider } from '../providers/Props';
import { CollapsibleContextProvider, useCollapsibleContext } from '../providers/Collapsible';
import { HeaderContextProvider } from '../providers/Header';
import { SCROLLABLE_TAB_WIDTH, TAB_BAR_HEIGHT } from '../constants/tabBar';
import useHandleIndexChange from '../hooks/useHandlerIndexChange';

/**
 * CollapsibleTabView - Instagram-style collapsible header with gesture continuity
 * 
 * Architecture:
 * - Outer ScrollView is the "master" - handles ALL vertical gestures
 * - Inner FlatList is non-scrollable, synced programmatically via scrollTo
 * - Single continuous gesture: collapse header → scroll content
 * - RefreshControl works natively on outer scroll
 * 
 * Scroll sync:
 * - outerScrollY: 0 to (headerHeight + maxInnerScroll)
 * - innerScrollY = max(0, outerScrollY - headerHeight)
 */

/**
 * Inner content component
 */
const CollapsibleTabViewInner = React.memo<{
  contentAreaHeight: number;
  tabViewCarouselRef: React.RefObject<CarouselImperativeHandle | null>;
}>(({ contentAreaHeight, tabViewCarouselRef }) => {
  useHandleIndexChange();

  return (
    <View style={[styles.tabContentArea, { height: contentAreaHeight }]}>
      <TabViewCarousel
        ref={tabViewCarouselRef as React.Ref<CarouselImperativeHandle>}
      />
    </View>
  );
});

/**
 * Scroll container with gesture sync
 */
const CollapsibleScrollContainer = React.memo<{
  headerHeight: number;
  tabBarHeight: number;
  viewportHeight: number;
  refreshing: boolean;
  onRefresh?: () => void;
  refreshControlColor?: string;
  headerElement: React.ReactNode;
  tabBarElement: React.ReactNode;
  contentAreaHeight: number;
  tabViewCarouselRef: React.RefObject<CarouselImperativeHandle | null>;
}>(({
  headerHeight,
  tabBarHeight,
  viewportHeight,
  refreshing,
  onRefresh,
  refreshControlColor,
  headerElement,
  tabBarElement,
  contentAreaHeight,
  tabViewCarouselRef,
}) => {
  const outerScrollRef = useAnimatedRef<Animated.ScrollView>();
  const { 
    outerScrollY, 
    innerScrollY, 
    maxInnerContentHeight,
    setContentAreaHeight,
  } = useCollapsibleContext();

  // Set the content area height in context (this is the viewport for inner scroll)
  useEffect(() => {
    if (contentAreaHeight > 0) {
      setContentAreaHeight(contentAreaHeight);
    }
  }, [contentAreaHeight, setContentAreaHeight]);

  console.log('[CollapsibleScrollContainer] Render with:', {
    headerHeight,
    tabBarHeight,
    viewportHeight,
    contentAreaHeight,
    maxInnerContentHeight,
  });

  // Calculate the max scroll for inner content
  // maxInnerContentHeight is the MAX content height across all tabs
  // contentAreaHeight is the viewport height (from parent container)
  const reportedMaxInnerScroll = Math.max(0, maxInnerContentHeight - contentAreaHeight);
  
  // When content height isn't known yet, use a reasonable default (5x viewport)
  // This allows initial scrolling while FlatList measures its content
  // The value will update dynamically as real content height is reported
  const defaultMinScroll = contentAreaHeight > 0 ? contentAreaHeight * 5 : 2000;
  const maxInnerScroll = reportedMaxInnerScroll > 0 ? reportedMaxInnerScroll : defaultMinScroll;
  
  console.log('[CollapsibleScrollContainer] Scroll calculations:', {
    maxInnerContentHeight,
    contentAreaHeight,
    reportedMaxInnerScroll,
    defaultMinScroll,
    maxInnerScroll,
    usingDefault: reportedMaxInnerScroll <= 0,
  });
  
  // Total outer scroll content height:
  // - Header (scrolls away)
  // - Tab bar (sticks)
  // - Content area height (viewport for inner content)
  // - Additional space to allow scrolling inner content via outer scroll
  const outerContentHeight = useMemo(() => {
    const height = headerHeight + tabBarHeight + contentAreaHeight + maxInnerScroll;
    console.log('[CollapsibleScrollContainer] outerContentHeight calculated:', {
      outerContentHeight: height,
      headerHeight,
      tabBarHeight,
      contentAreaHeight,
      maxInnerScroll,
      maxInnerContentHeight,
      maxScrollPosition: height - viewportHeight,
    });
    return height;
  }, [headerHeight, tabBarHeight, contentAreaHeight, maxInnerScroll, maxInnerContentHeight, viewportHeight]);

  // Log scroll position (called from worklet via runOnJS)
  const logScrollPosition = useCallback((outerY: number, innerY: number, contentOffsetY: number) => {
    // Only log occasionally to avoid spam (and not for 0)
    if (outerY > 0 && Math.floor(outerY) % 200 === 0) {
      console.log('[CollapsibleScrollContainer] Scroll:', {
        contentOffsetY,
        outerScrollY: outerY,
        innerScrollY: innerY,
        headerHeight,
      });
    }
  }, [headerHeight]);

  // Animated scroll handler - syncs outer scroll to inner scroll
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      outerScrollY.value = y;
      
      // Calculate inner scroll position
      // Inner starts scrolling after header is collapsed
      const newInnerY = Math.max(0, y - headerHeight);
      innerScrollY.value = newInnerY;
      
      // Log for debugging (throttled)
      runOnJS(logScrollPosition)(y, newInnerY, event.contentOffset.y);
    },
  });

  return (
    <Animated.ScrollView
      ref={outerScrollRef}
      style={styles.outerScroll}
      contentContainerStyle={[
        styles.outerScrollContent,
        { minHeight: outerContentHeight },
      ]}
      scrollEventThrottle={16}
      bounces={true}
      alwaysBounceVertical={true}
      showsVerticalScrollIndicator={true}
      // Sticky tab bar at index 1 (after header)
      stickyHeaderIndices={[1]}
      // Native RefreshControl - this is why we use outer scroll for gestures!
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshControlColor}
            colors={refreshControlColor ? [refreshControlColor] : undefined}
          />
        ) : undefined
      }
      // Animated scroll handler for sync
      onScroll={scrollHandler}
      // Enable nested scroll for Android
      nestedScrollEnabled={true}
    >
      {/* Header - scrolls away naturally */}
      {headerElement}

      {/* Tab Bar - becomes sticky when header scrolls away */}
      <View style={styles.stickyTabBarContainer}>
        {tabBarElement}
      </View>

      {/* Tab Content Area - inner FlatList is synced programmatically */}
      <CollapsibleTabViewInner
        contentAreaHeight={contentAreaHeight}
        tabViewCarouselRef={tabViewCarouselRef}
      />
    </Animated.ScrollView>
  );
});

/**
 * Main CollapsibleTabView component
 */
export const CollapsibleTabView = React.memo(
  React.forwardRef<TabViewMethods, TabViewProps>((props, ref) => {
    const {
      navigationState,
      initialLayout,
      animatedRouteIndex: providedAnimatedRouteIndexSV,
      sceneContainerStyle,
      tabViewCarouselStyle,
      keyboardDismissMode = 'auto',
      swipeEnabled = true,
      renderMode = 'all',
      tabBarConfig,
      jumpMode = 'smooth',
      sceneContainerGap = 0,
      renderHeader,
      renderScene,
      onIndexChange,
      onSwipeEnd,
      onSwipeStart,
      style,
      refreshing = false,
      onRefresh,
      refreshControlColor,
    } = props;

    const {
      tabBarType = 'secondary',
      tabBarPosition = 'top',
      tabBarScrollEnabled = false,
      tabBarDynamicWidthEnabled: _tabBarDynamicWidthEnabled,
      scrollableTabWidth = SCROLLABLE_TAB_WIDTH,
      tabBarStyle,
      tabBarIndicatorStyle,
      tabStyle,
      tabLabelStyle,
      renderTabBar,
    } = tabBarConfig ?? {};

    // Layout state
    const [tabViewLayout, setTabViewLayout] = useState<Layout>({
      width: 0,
      height: 0,
      ...initialLayout?.tabView,
    });

    const [tabBarLayout, setTabBarLayout] = useState<Layout>({
      width: tabViewLayout.width,
      height: TAB_BAR_HEIGHT,
      ...initialLayout?.tabBar,
    });

    const [tabViewCarouselLayout, setTabViewCarouselLayout] = useState<Layout>({
      width: tabViewLayout.width,
      height: tabViewLayout.height - tabBarLayout.height,
    });

    const [tabViewHeaderLayout, setTabViewHeaderLayout] = useState<Layout>({
      width: initialLayout?.tabView?.width ?? 0,
      height: 0,
      ...initialLayout?.tabViewHeader,
    });

    // Refs
    const tabViewCarouselRef = useRef<CarouselImperativeHandle | null>(null);

    // Route state
    const animatedRouteIndex = useSharedValue(navigationState.index);
    const [initialRouteIndex] = useState(navigationState.index);
    const [currentRouteIndex, setCurrentRouteIndex] = useState(initialRouteIndex);

    const routes = useMemo(() => navigationState.routes, [navigationState.routes]);
    const noOfRoutes = routes.length;

    const tabBarDynamicWidthEnabled = useMemo(() => {
      if (_tabBarDynamicWidthEnabled !== undefined) {
        return _tabBarDynamicWidthEnabled;
      }
      return tabBarType === 'primary';
    }, [_tabBarDynamicWidthEnabled, tabBarType]);

    // Handlers
    const jumpTo = useCallback((routeKey: string) => {
      tabViewCarouselRef.current?.jumpToRoute(routeKey);
    }, []);

    useImperativeHandle(ref, () => ({ jumpTo }), [jumpTo]);

    // Layout callbacks
    const onTabViewLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
      const { width, height } = nativeEvent.layout;
      setTabViewLayout((prev) => ({ ...prev, width, height }));
    }, []);

    const onHeaderLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
      const { width, height } = nativeEvent.layout;
      setTabViewHeaderLayout((prev) => ({ ...prev, width, height }));
    }, []);

    // Context values
    const propsContextValue = useMemo(
      () => ({
        navigationState,
        renderMode,
        tabBarType,
        tabBarPosition,
        tabBarScrollEnabled,
        tabBarDynamicWidthEnabled,
        scrollableTabWidth,
        tabBarStyle,
        tabBarIndicatorStyle,
        tabStyle,
        tabLabelStyle,
        swipeEnabled,
        jumpMode,
        sceneContainerGap,
        sceneContainerStyle,
        tabViewCarouselStyle,
        keyboardDismissMode,
        providedAnimatedRouteIndexSV,
        renderTabBar,
        renderScene,
        renderHeader,
        onIndexChange,
        onSwipeEnd,
        onSwipeStart,
        refreshing,
        onRefresh,
        refreshControlColor,
      }),
      [
        navigationState,
        renderMode,
        tabBarType,
        tabBarPosition,
        tabBarScrollEnabled,
        tabBarDynamicWidthEnabled,
        scrollableTabWidth,
        tabBarStyle,
        tabBarIndicatorStyle,
        tabStyle,
        tabLabelStyle,
        swipeEnabled,
        jumpMode,
        sceneContainerGap,
        sceneContainerStyle,
        tabViewCarouselStyle,
        keyboardDismissMode,
        providedAnimatedRouteIndexSV,
        renderTabBar,
        renderScene,
        renderHeader,
        onIndexChange,
        onSwipeEnd,
        onSwipeStart,
        refreshing,
        onRefresh,
        refreshControlColor,
      ]
    );

    const internalContextValue = useMemo(
      () => ({
        tabViewLayout,
        tabViewHeaderLayout,
        tabBarLayout,
        tabViewCarouselLayout,
        tabViewCarouselRef,
        routes,
        noOfRoutes,
        animatedRouteIndex,
        initialRouteIndex,
        currentRouteIndex,
        setCurrentRouteIndex,
        jumpTo,
        setTabViewLayout,
        setTabViewHeaderLayout,
        setTabBarLayout,
        setTabViewCarouselLayout,
      }),
      [
        tabViewLayout,
        tabViewHeaderLayout,
        tabBarLayout,
        tabViewCarouselLayout,
        routes,
        noOfRoutes,
        animatedRouteIndex,
        currentRouteIndex,
        initialRouteIndex,
        jumpTo,
      ]
    );

    // Tab bar element
    const tabBarElement = useMemo(() => {
      if (renderTabBar) {
        return renderTabBar({
          getLabelText: (scene) => scene.route.title,
          tabStyle,
          labelStyle: tabLabelStyle,
          style: tabBarStyle,
        });
      }
      return (
        <TabBar
          getLabelText={(scene) => scene.route.title}
          tabStyle={tabStyle}
          labelStyle={tabLabelStyle}
          style={tabBarStyle}
        />
      );
    }, [renderTabBar, tabStyle, tabLabelStyle, tabBarStyle]);

    // Header element
    const headerElement = useMemo(() => {
      if (!renderHeader) return null;

      return (
        <View onLayout={onHeaderLayout}>
          {renderHeader({
            collapsedPercentage: { value: 0 } as any,
            collapsedHeaderHeight: { value: 0 } as any,
          })}
        </View>
      );
    }, [renderHeader, onHeaderLayout]);

    // Calculate content area height (viewport for inner content)
    const contentAreaHeight = useMemo(() => {
      return Math.max(0, tabViewLayout.height - tabBarLayout.height);
    }, [tabViewLayout.height, tabBarLayout.height]);

    return (
      <View style={[styles.container, style]} onLayout={onTabViewLayout}>
        <PropsContextProvider value={propsContextValue}>
          <InternalContextProvider value={internalContextValue}>
            <TabLayoutContextProvider>
              <CollapsibleContextProvider
                headerHeight={tabViewHeaderLayout.height}
                onRefresh={onRefresh}
                refreshing={refreshing}
              >
                <HeaderContextProvider>
                  <CollapsibleScrollContainer
                    headerHeight={tabViewHeaderLayout.height}
                    tabBarHeight={tabBarLayout.height}
                    viewportHeight={tabViewLayout.height}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    refreshControlColor={refreshControlColor}
                    headerElement={headerElement}
                    tabBarElement={tabBarElement}
                    contentAreaHeight={contentAreaHeight}
                    tabViewCarouselRef={tabViewCarouselRef}
                  />
                </HeaderContextProvider>
              </CollapsibleContextProvider>
            </TabLayoutContextProvider>
          </InternalContextProvider>
        </PropsContextProvider>
      </View>
    );
  })
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  outerScroll: {
    flex: 1,
  },
  outerScrollContent: {
    flexGrow: 1,
  },
  stickyTabBarContainer: {
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  tabContentArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
