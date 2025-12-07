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
  refreshing: boolean;
  onRefresh?: () => void;
  refreshControlColor?: string;
  headerElement: React.ReactNode;
  tabBarElement: React.ReactNode;
  contentAreaHeight: number;
  tabViewCarouselRef: React.RefObject<CarouselImperativeHandle | null>;
  currentActiveRouteKey: string;
}>(({
  headerHeight,
  tabBarHeight,
  refreshing,
  onRefresh,
  refreshControlColor,
  headerElement,
  tabBarElement,
  contentAreaHeight,
  tabViewCarouselRef,
  currentActiveRouteKey,
}) => {
  const outerScrollRef = useAnimatedRef<Animated.ScrollView>();
  const { 
    outerScrollY, 
    innerScrollY, 
    setContentAreaHeight,
    getInnerContentHeight,
    activeRouteKey,
    setActiveRouteKey,
  } = useCollapsibleContext();

  // Set the content area height in context (this is the viewport for inner scroll)
  useEffect(() => {
    if (contentAreaHeight > 0) {
      setContentAreaHeight(contentAreaHeight);
    }
  }, [contentAreaHeight, setContentAreaHeight]);

  // Update active route key when it changes
  useEffect(() => {
    if (currentActiveRouteKey && activeRouteKey !== currentActiveRouteKey) {
      setActiveRouteKey(currentActiveRouteKey);
    }
  }, [currentActiveRouteKey, activeRouteKey, setActiveRouteKey]);

  // Get the ACTIVE tab's content height (not max across all tabs)
  // This ensures scroll bounds match the current tab's actual content
  const activeContentHeight = activeRouteKey ? getInnerContentHeight(activeRouteKey) : 0;
  
  // Check if we have valid content height data
  const hasContentHeightData = activeContentHeight > 0;
  
  // Calculate the max scroll for inner content
  // If content fits in viewport, this will be 0 (no scrolling needed)
  const calculatedMaxInnerScroll = hasContentHeightData 
    ? Math.max(0, activeContentHeight - contentAreaHeight)
    : 0;
  
  // Only use default when we DON'T have content height data yet
  // Once we have data, use the calculated value (even if it's 0)
  const defaultMinScroll = contentAreaHeight > 0 ? contentAreaHeight * 5 : 2000;
  const maxInnerScroll = hasContentHeightData ? calculatedMaxInnerScroll : defaultMinScroll;
  
  // Total outer scroll content height:
  // - Header (scrolls away)
  // - Tab bar (sticks)
  // - Content area height (viewport for inner content)
  // - Additional space to allow scrolling inner content via outer scroll
  const outerContentHeight = useMemo(() => {
    return headerHeight + tabBarHeight + contentAreaHeight + maxInnerScroll;
  }, [headerHeight, tabBarHeight, contentAreaHeight, maxInnerScroll]);

  // Animated scroll handler - syncs outer scroll to inner scroll
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      outerScrollY.value = y;
      
      // Calculate inner scroll position
      // Inner starts scrolling after header is collapsed
      const newInnerY = Math.max(0, y - headerHeight);
      innerScrollY.value = newInnerY;
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
      showsVerticalScrollIndicator={false}
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
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    refreshControlColor={refreshControlColor}
                    headerElement={headerElement}
                    tabBarElement={tabBarElement}
                    contentAreaHeight={contentAreaHeight}
                    tabViewCarouselRef={tabViewCarouselRef}
                    currentActiveRouteKey={routes[currentRouteIndex]?.key || ''}
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
