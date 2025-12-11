import React, { useCallback, useMemo, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { View, StyleSheet, RefreshControl, LogBox, InteractionManager } from 'react-native';
import Animated, { useSharedValue, useAnimatedRef, useAnimatedScrollHandler } from 'react-native-reanimated';

// Suppress the VirtualizedList warning - this is expected in collapsible header patterns
LogBox.ignoreLogs(['VirtualizedLists should never be nested inside plain ScrollViews']);
import { TabBar } from './TabBar';
import TabViewCarousel from './TabViewCarousel';
import { TabLayoutContextProvider } from '../providers/TabLayout';
import { InternalContextProvider } from '../providers/Internal';
import { PropsContextProvider } from '../providers/Props';
import { CollapsibleContextProvider, useCollapsibleContext } from '../providers/Collapsible';
import { HeaderContextProvider } from '../providers/Header';
import { SCROLLABLE_TAB_WIDTH, TAB_BAR_HEIGHT } from '../constants/tabBar';
import { IOS_REFRESH_TINT_COLOR_DELAY } from '../constants/refresh';
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
const CollapsibleTabViewInner = /*#__PURE__*/React.memo(({
  contentAreaHeight,
  tabViewCarouselRef
}) => {
  useHandleIndexChange();
  return /*#__PURE__*/React.createElement(View, {
    style: [styles.tabContentArea, {
      height: contentAreaHeight
    }]
  }, /*#__PURE__*/React.createElement(TabViewCarousel, {
    ref: tabViewCarouselRef
  }));
});

/**
 * Scroll container with gesture sync
 */
const CollapsibleScrollContainer = /*#__PURE__*/React.memo(({
  headerHeight,
  tabBarHeight,
  refreshing,
  onRefresh,
  refreshControlColor,
  refreshControlBackgroundColor,
  headerElement,
  tabBarElement,
  contentAreaHeight,
  tabViewCarouselRef,
  currentActiveRouteKey
}) => {
  const outerScrollRef = useAnimatedRef();
  const {
    outerScrollY,
    innerScrollY,
    setContentAreaHeight,
    getInnerContentHeight,
    activeRouteKey,
    setActiveRouteKey
  } = useCollapsibleContext();

  // iOS workaround: Apply tintColor after interactions complete
  // (iOS doesn't apply tintColor correctly on initial render, especially in release builds)
  const [delayedTintColor, setDelayedTintColor] = useState(undefined);
  useEffect(() => {
    if (refreshControlColor) {
      // Use InteractionManager to wait for animations/interactions to complete,
      // then add a delay for the native component to be ready
      const interactionPromise = InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          setDelayedTintColor(refreshControlColor);
        }, IOS_REFRESH_TINT_COLOR_DELAY);
      });
      return () => interactionPromise.cancel();
    }
    setDelayedTintColor(undefined);
    return undefined;
  }, [refreshControlColor]);

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
  const calculatedMaxInnerScroll = hasContentHeightData ? Math.max(0, activeContentHeight - contentAreaHeight) : 0;

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
    onScroll: event => {
      const y = event.contentOffset.y;
      outerScrollY.value = y;

      // Calculate inner scroll position
      // Inner starts scrolling after header is collapsed
      const newInnerY = Math.max(0, y - headerHeight);
      innerScrollY.value = newInnerY;
    }
  });
  return /*#__PURE__*/React.createElement(Animated.ScrollView, {
    ref: outerScrollRef,
    style: styles.outerScroll,
    contentContainerStyle: [styles.outerScrollContent, {
      minHeight: outerContentHeight
    }],
    scrollEventThrottle: 16,
    bounces: true,
    alwaysBounceVertical: true,
    showsVerticalScrollIndicator: false
    // Sticky tab bar at index 1 (after header)
    ,
    stickyHeaderIndices: [1]
    // Native RefreshControl - this is why we use outer scroll for gestures!
    // Note: Using delayedTintColor for iOS workaround (tintColor doesn't apply on initial render)
    ,
    refreshControl: onRefresh ? /*#__PURE__*/React.createElement(RefreshControl, {
      refreshing: refreshing,
      onRefresh: onRefresh,
      tintColor: delayedTintColor,
      colors: refreshControlColor ? [refreshControlColor] : undefined,
      progressBackgroundColor: refreshControlBackgroundColor
    }) : undefined
    // Animated scroll handler for sync
    ,
    onScroll: scrollHandler
    // Enable nested scroll for Android
    ,
    nestedScrollEnabled: true
  }, headerElement, /*#__PURE__*/React.createElement(View, {
    style: styles.stickyTabBarContainer
  }, tabBarElement), /*#__PURE__*/React.createElement(CollapsibleTabViewInner, {
    contentAreaHeight: contentAreaHeight,
    tabViewCarouselRef: tabViewCarouselRef
  }));
});

/**
 * Main CollapsibleTabView component
 */
export const CollapsibleTabView = /*#__PURE__*/React.memo( /*#__PURE__*/React.forwardRef((props, ref) => {
  var _initialLayout$tabVie, _routes$currentRouteI;
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
    refreshControlBackgroundColor
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
    renderTabBar
  } = tabBarConfig ?? {};

  // Layout state
  const [tabViewLayout, setTabViewLayout] = useState({
    width: 0,
    height: 0,
    ...(initialLayout === null || initialLayout === void 0 ? void 0 : initialLayout.tabView)
  });
  const [tabBarLayout, setTabBarLayout] = useState({
    width: tabViewLayout.width,
    height: TAB_BAR_HEIGHT,
    ...(initialLayout === null || initialLayout === void 0 ? void 0 : initialLayout.tabBar)
  });
  const [tabViewCarouselLayout, setTabViewCarouselLayout] = useState({
    width: tabViewLayout.width,
    height: tabViewLayout.height - tabBarLayout.height
  });
  const [tabViewHeaderLayout, setTabViewHeaderLayout] = useState({
    width: (initialLayout === null || initialLayout === void 0 || (_initialLayout$tabVie = initialLayout.tabView) === null || _initialLayout$tabVie === void 0 ? void 0 : _initialLayout$tabVie.width) ?? 0,
    height: 0,
    ...(initialLayout === null || initialLayout === void 0 ? void 0 : initialLayout.tabViewHeader)
  });

  // Refs
  const tabViewCarouselRef = useRef(null);

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
  const jumpTo = useCallback(routeKey => {
    var _tabViewCarouselRef$c;
    (_tabViewCarouselRef$c = tabViewCarouselRef.current) === null || _tabViewCarouselRef$c === void 0 || _tabViewCarouselRef$c.jumpToRoute(routeKey);
  }, []);
  useImperativeHandle(ref, () => ({
    jumpTo
  }), [jumpTo]);

  // Layout callbacks
  const onTabViewLayout = useCallback(({
    nativeEvent
  }) => {
    const {
      width,
      height
    } = nativeEvent.layout;
    setTabViewLayout(prev => ({
      ...prev,
      width,
      height
    }));
  }, []);
  const onHeaderLayout = useCallback(({
    nativeEvent
  }) => {
    const {
      width,
      height
    } = nativeEvent.layout;
    setTabViewHeaderLayout(prev => ({
      ...prev,
      width,
      height
    }));
  }, []);

  // Context values
  const propsContextValue = useMemo(() => ({
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
    refreshControlBackgroundColor
  }), [navigationState, renderMode, tabBarType, tabBarPosition, tabBarScrollEnabled, tabBarDynamicWidthEnabled, scrollableTabWidth, tabBarStyle, tabBarIndicatorStyle, tabStyle, tabLabelStyle, swipeEnabled, jumpMode, sceneContainerGap, sceneContainerStyle, tabViewCarouselStyle, keyboardDismissMode, providedAnimatedRouteIndexSV, renderTabBar, renderScene, renderHeader, onIndexChange, onSwipeEnd, onSwipeStart, refreshing, onRefresh, refreshControlColor, refreshControlBackgroundColor]);
  const internalContextValue = useMemo(() => ({
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
    setTabViewCarouselLayout
  }), [tabViewLayout, tabViewHeaderLayout, tabBarLayout, tabViewCarouselLayout, routes, noOfRoutes, animatedRouteIndex, currentRouteIndex, initialRouteIndex, jumpTo]);

  // Tab bar element
  const tabBarElement = useMemo(() => {
    if (renderTabBar) {
      return renderTabBar({
        getLabelText: scene => scene.route.title,
        tabStyle,
        labelStyle: tabLabelStyle,
        style: tabBarStyle
      });
    }
    return /*#__PURE__*/React.createElement(TabBar, {
      getLabelText: scene => scene.route.title,
      tabStyle: tabStyle,
      labelStyle: tabLabelStyle,
      style: tabBarStyle
    });
  }, [renderTabBar, tabStyle, tabLabelStyle, tabBarStyle]);

  // Header element
  const headerElement = useMemo(() => {
    if (!renderHeader) return null;
    return /*#__PURE__*/React.createElement(View, {
      onLayout: onHeaderLayout
    }, renderHeader({
      collapsedPercentage: {
        value: 0
      },
      collapsedHeaderHeight: {
        value: 0
      }
    }));
  }, [renderHeader, onHeaderLayout]);

  // Calculate content area height (viewport for inner content)
  const contentAreaHeight = useMemo(() => {
    return Math.max(0, tabViewLayout.height - tabBarLayout.height);
  }, [tabViewLayout.height, tabBarLayout.height]);
  return /*#__PURE__*/React.createElement(View, {
    style: [styles.container, style],
    onLayout: onTabViewLayout
  }, /*#__PURE__*/React.createElement(PropsContextProvider, {
    value: propsContextValue
  }, /*#__PURE__*/React.createElement(InternalContextProvider, {
    value: internalContextValue
  }, /*#__PURE__*/React.createElement(TabLayoutContextProvider, null, /*#__PURE__*/React.createElement(CollapsibleContextProvider, {
    headerHeight: tabViewHeaderLayout.height,
    onRefresh: onRefresh,
    refreshing: refreshing
  }, /*#__PURE__*/React.createElement(HeaderContextProvider, null, /*#__PURE__*/React.createElement(CollapsibleScrollContainer, {
    headerHeight: tabViewHeaderLayout.height,
    tabBarHeight: tabBarLayout.height,
    refreshing: refreshing,
    onRefresh: onRefresh,
    refreshControlColor: refreshControlColor,
    refreshControlBackgroundColor: refreshControlBackgroundColor,
    headerElement: headerElement,
    tabBarElement: tabBarElement,
    contentAreaHeight: contentAreaHeight,
    tabViewCarouselRef: tabViewCarouselRef,
    currentActiveRouteKey: ((_routes$currentRouteI = routes[currentRouteIndex]) === null || _routes$currentRouteI === void 0 ? void 0 : _routes$currentRouteI.key) || ''
  })))))));
}));
const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden'
  },
  outerScroll: {
    flex: 1
  },
  outerScrollContent: {
    flexGrow: 1
  },
  stickyTabBarContainer: {
    backgroundColor: '#FFFFFF',
    zIndex: 1
  },
  tabContentArea: {
    flex: 1,
    overflow: 'hidden'
  }
});
//# sourceMappingURL=CollapsibleTabView.js.map