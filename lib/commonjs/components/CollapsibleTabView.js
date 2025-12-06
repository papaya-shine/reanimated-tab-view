"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CollapsibleTabView = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _TabBar = require("./TabBar");
var _TabViewCarousel = _interopRequireDefault(require("./TabViewCarousel"));
var _TabLayout = require("../providers/TabLayout");
var _Internal = require("../providers/Internal");
var _Props = require("../providers/Props");
var _Collapsible = require("../providers/Collapsible");
var _Header = require("../providers/Header");
var _tabBar = require("../constants/tabBar");
var _useHandlerIndexChange = _interopRequireDefault(require("../hooks/useHandlerIndexChange"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// Suppress the VirtualizedList warning - this is expected in collapsible header patterns
_reactNative.LogBox.ignoreLogs(['VirtualizedLists should never be nested inside plain ScrollViews']);
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
const CollapsibleTabViewInner = /*#__PURE__*/_react.default.memo(({
  contentAreaHeight,
  tabViewCarouselRef
}) => {
  (0, _useHandlerIndexChange.default)();
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.tabContentArea, {
      height: contentAreaHeight
    }]
  }, /*#__PURE__*/_react.default.createElement(_TabViewCarousel.default, {
    ref: tabViewCarouselRef
  }));
});

/**
 * Scroll container with gesture sync
 */
const CollapsibleScrollContainer = /*#__PURE__*/_react.default.memo(({
  headerHeight,
  tabBarHeight,
  viewportHeight,
  refreshing,
  onRefresh,
  refreshControlColor,
  headerElement,
  tabBarElement,
  contentAreaHeight,
  tabViewCarouselRef
}) => {
  const outerScrollRef = (0, _reactNativeReanimated.useAnimatedRef)();
  const {
    outerScrollY,
    innerScrollY,
    maxInnerContentHeight,
    setContentAreaHeight
  } = (0, _Collapsible.useCollapsibleContext)();

  // Set the content area height in context (this is the viewport for inner scroll)
  (0, _react.useEffect)(() => {
    if (contentAreaHeight > 0) {
      setContentAreaHeight(contentAreaHeight);
    }
  }, [contentAreaHeight, setContentAreaHeight]);

  // Calculate the max scroll for inner content
  // maxInnerContentHeight is the MAX content height across all tabs
  // contentAreaHeight is the viewport height (from parent container)
  const reportedMaxInnerScroll = Math.max(0, maxInnerContentHeight - contentAreaHeight);

  // When content height isn't known yet, use a reasonable default (5x viewport)
  // This allows initial scrolling while FlatList measures its content
  // The value will update dynamically as real content height is reported
  const defaultMinScroll = contentAreaHeight > 0 ? contentAreaHeight * 5 : 2000;
  const maxInnerScroll = reportedMaxInnerScroll > 0 ? reportedMaxInnerScroll : defaultMinScroll;

  // Total outer scroll content height:
  // - Header (scrolls away)
  // - Tab bar (sticks)
  // - Content area height (viewport for inner content)
  // - Additional space to allow scrolling inner content via outer scroll
  const outerContentHeight = (0, _react.useMemo)(() => {
    return headerHeight + tabBarHeight + contentAreaHeight + maxInnerScroll;
  }, [headerHeight, tabBarHeight, contentAreaHeight, maxInnerScroll]);

  // Animated scroll handler - syncs outer scroll to inner scroll
  const scrollHandler = (0, _reactNativeReanimated.useAnimatedScrollHandler)({
    onScroll: event => {
      const y = event.contentOffset.y;
      outerScrollY.value = y;

      // Calculate inner scroll position
      // Inner starts scrolling after header is collapsed
      const newInnerY = Math.max(0, y - headerHeight);
      innerScrollY.value = newInnerY;
    }
  });
  return /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.ScrollView, {
    ref: outerScrollRef,
    style: styles.outerScroll,
    contentContainerStyle: [styles.outerScrollContent, {
      minHeight: outerContentHeight
    }],
    scrollEventThrottle: 16,
    bounces: true,
    alwaysBounceVertical: true,
    showsVerticalScrollIndicator: true
    // Sticky tab bar at index 1 (after header)
    ,
    stickyHeaderIndices: [1]
    // Native RefreshControl - this is why we use outer scroll for gestures!
    ,
    refreshControl: onRefresh ? /*#__PURE__*/_react.default.createElement(_reactNative.RefreshControl, {
      refreshing: refreshing,
      onRefresh: onRefresh,
      tintColor: refreshControlColor,
      colors: refreshControlColor ? [refreshControlColor] : undefined
    }) : undefined
    // Animated scroll handler for sync
    ,
    onScroll: scrollHandler
    // Enable nested scroll for Android
    ,
    nestedScrollEnabled: true
  }, headerElement, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.stickyTabBarContainer
  }, tabBarElement), /*#__PURE__*/_react.default.createElement(CollapsibleTabViewInner, {
    contentAreaHeight: contentAreaHeight,
    tabViewCarouselRef: tabViewCarouselRef
  }));
});

/**
 * Main CollapsibleTabView component
 */
const CollapsibleTabView = exports.CollapsibleTabView = /*#__PURE__*/_react.default.memo( /*#__PURE__*/_react.default.forwardRef((props, ref) => {
  var _initialLayout$tabVie;
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
    refreshControlColor
  } = props;
  const {
    tabBarType = 'secondary',
    tabBarPosition = 'top',
    tabBarScrollEnabled = false,
    tabBarDynamicWidthEnabled: _tabBarDynamicWidthEnabled,
    scrollableTabWidth = _tabBar.SCROLLABLE_TAB_WIDTH,
    tabBarStyle,
    tabBarIndicatorStyle,
    tabStyle,
    tabLabelStyle,
    renderTabBar
  } = tabBarConfig ?? {};

  // Layout state
  const [tabViewLayout, setTabViewLayout] = (0, _react.useState)({
    width: 0,
    height: 0,
    ...(initialLayout === null || initialLayout === void 0 ? void 0 : initialLayout.tabView)
  });
  const [tabBarLayout, setTabBarLayout] = (0, _react.useState)({
    width: tabViewLayout.width,
    height: _tabBar.TAB_BAR_HEIGHT,
    ...(initialLayout === null || initialLayout === void 0 ? void 0 : initialLayout.tabBar)
  });
  const [tabViewCarouselLayout, setTabViewCarouselLayout] = (0, _react.useState)({
    width: tabViewLayout.width,
    height: tabViewLayout.height - tabBarLayout.height
  });
  const [tabViewHeaderLayout, setTabViewHeaderLayout] = (0, _react.useState)({
    width: (initialLayout === null || initialLayout === void 0 || (_initialLayout$tabVie = initialLayout.tabView) === null || _initialLayout$tabVie === void 0 ? void 0 : _initialLayout$tabVie.width) ?? 0,
    height: 0,
    ...(initialLayout === null || initialLayout === void 0 ? void 0 : initialLayout.tabViewHeader)
  });

  // Refs
  const tabViewCarouselRef = (0, _react.useRef)(null);

  // Route state
  const animatedRouteIndex = (0, _reactNativeReanimated.useSharedValue)(navigationState.index);
  const [initialRouteIndex] = (0, _react.useState)(navigationState.index);
  const [currentRouteIndex, setCurrentRouteIndex] = (0, _react.useState)(initialRouteIndex);
  const routes = (0, _react.useMemo)(() => navigationState.routes, [navigationState.routes]);
  const noOfRoutes = routes.length;
  const tabBarDynamicWidthEnabled = (0, _react.useMemo)(() => {
    if (_tabBarDynamicWidthEnabled !== undefined) {
      return _tabBarDynamicWidthEnabled;
    }
    return tabBarType === 'primary';
  }, [_tabBarDynamicWidthEnabled, tabBarType]);

  // Handlers
  const jumpTo = (0, _react.useCallback)(routeKey => {
    var _tabViewCarouselRef$c;
    (_tabViewCarouselRef$c = tabViewCarouselRef.current) === null || _tabViewCarouselRef$c === void 0 || _tabViewCarouselRef$c.jumpToRoute(routeKey);
  }, []);
  (0, _react.useImperativeHandle)(ref, () => ({
    jumpTo
  }), [jumpTo]);

  // Layout callbacks
  const onTabViewLayout = (0, _react.useCallback)(({
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
  const onHeaderLayout = (0, _react.useCallback)(({
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
  const propsContextValue = (0, _react.useMemo)(() => ({
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
    refreshControlColor
  }), [navigationState, renderMode, tabBarType, tabBarPosition, tabBarScrollEnabled, tabBarDynamicWidthEnabled, scrollableTabWidth, tabBarStyle, tabBarIndicatorStyle, tabStyle, tabLabelStyle, swipeEnabled, jumpMode, sceneContainerGap, sceneContainerStyle, tabViewCarouselStyle, keyboardDismissMode, providedAnimatedRouteIndexSV, renderTabBar, renderScene, renderHeader, onIndexChange, onSwipeEnd, onSwipeStart, refreshing, onRefresh, refreshControlColor]);
  const internalContextValue = (0, _react.useMemo)(() => ({
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
  const tabBarElement = (0, _react.useMemo)(() => {
    if (renderTabBar) {
      return renderTabBar({
        getLabelText: scene => scene.route.title,
        tabStyle,
        labelStyle: tabLabelStyle,
        style: tabBarStyle
      });
    }
    return /*#__PURE__*/_react.default.createElement(_TabBar.TabBar, {
      getLabelText: scene => scene.route.title,
      tabStyle: tabStyle,
      labelStyle: tabLabelStyle,
      style: tabBarStyle
    });
  }, [renderTabBar, tabStyle, tabLabelStyle, tabBarStyle]);

  // Header element
  const headerElement = (0, _react.useMemo)(() => {
    if (!renderHeader) return null;
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
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
  const contentAreaHeight = (0, _react.useMemo)(() => {
    return Math.max(0, tabViewLayout.height - tabBarLayout.height);
  }, [tabViewLayout.height, tabBarLayout.height]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.container, style],
    onLayout: onTabViewLayout
  }, /*#__PURE__*/_react.default.createElement(_Props.PropsContextProvider, {
    value: propsContextValue
  }, /*#__PURE__*/_react.default.createElement(_Internal.InternalContextProvider, {
    value: internalContextValue
  }, /*#__PURE__*/_react.default.createElement(_TabLayout.TabLayoutContextProvider, null, /*#__PURE__*/_react.default.createElement(_Collapsible.CollapsibleContextProvider, {
    headerHeight: tabViewHeaderLayout.height,
    onRefresh: onRefresh,
    refreshing: refreshing
  }, /*#__PURE__*/_react.default.createElement(_Header.HeaderContextProvider, null, /*#__PURE__*/_react.default.createElement(CollapsibleScrollContainer, {
    headerHeight: tabViewHeaderLayout.height,
    tabBarHeight: tabBarLayout.height,
    viewportHeight: tabViewLayout.height,
    refreshing: refreshing,
    onRefresh: onRefresh,
    refreshControlColor: refreshControlColor,
    headerElement: headerElement,
    tabBarElement: tabBarElement,
    contentAreaHeight: contentAreaHeight,
    tabViewCarouselRef: tabViewCarouselRef
  })))))));
}));
const styles = _reactNative.StyleSheet.create({
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