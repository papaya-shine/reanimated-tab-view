"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TabView = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = require("react-native-reanimated");
var _TabViewCarousel = _interopRequireDefault(require("./TabViewCarousel"));
var _TabBar = require("./TabBar");
var _TabLayout = require("../providers/TabLayout");
var _Internal = require("../providers/Internal");
var _Props = require("../providers/Props");
var _tabBar = require("../constants/tabBar");
var _useHandlerIndexChange = _interopRequireDefault(require("../hooks/useHandlerIndexChange"));
var _Header = require("../providers/Header");
var _CollapsibleTabView = require("./CollapsibleTabView");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
/**
 * StaticTabViewContent - For non-collapsible mode (no renderHeader)
 *
 * In this mode:
 * - Tab bar is fixed at top/bottom
 * - No header to collapse
 * - RefreshControl is handled per-tab in the content (via RTVFlatList/RTVScrollView)
 */
const StaticTabViewContent = /*#__PURE__*/_react.default.memo(() => {
  const {
    tabBarPosition,
    tabBarStyle,
    tabStyle,
    tabLabelStyle,
    renderTabBar
  } = (0, _Props.usePropsContext)();
  const {
    tabViewLayout,
    tabViewCarouselRef,
    setTabViewLayout
  } = (0, _Internal.useInternalContext)();
  const containerLayoutStyle = (0, _react.useMemo)(() => {
    const width = (tabViewLayout === null || tabViewLayout === void 0 ? void 0 : tabViewLayout.width) || '100%';
    return {
      width
    };
  }, [tabViewLayout]);
  (0, _useHandlerIndexChange.default)();
  const onTabViewLayout = (0, _react.useCallback)(({
    nativeEvent
  }) => {
    const {
      width,
      height
    } = nativeEvent.layout;
    setTabViewLayout(prevLayout => ({
      ...prevLayout,
      width,
      height
    }));
  }, [setTabViewLayout]);
  const tabBar = (0, _react.useMemo)(() => {
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
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.container, containerLayoutStyle],
    onLayout: onTabViewLayout
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.contentWrapper
  }, tabBarPosition === 'top' && tabBar, /*#__PURE__*/_react.default.createElement(_TabViewCarousel.default, {
    ref: tabViewCarouselRef
  }), tabBarPosition === 'bottom' && tabBar));
});

/**
 * StaticTabView - Wrapper with providers for non-collapsible mode
 */
const StaticTabView = /*#__PURE__*/_react.default.memo( /*#__PURE__*/_react.default.forwardRef((props, ref) => {
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
    renderScene,
    onIndexChange,
    onSwipeEnd,
    onSwipeStart,
    // Pull-to-refresh props (for static mode, these are passed to content)
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
  const tabViewCarouselRef = (0, _react.useRef)(null);
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
  const jumpTo = (0, _react.useCallback)(routeKey => {
    var _tabViewCarouselRef$c;
    (_tabViewCarouselRef$c = tabViewCarouselRef.current) === null || _tabViewCarouselRef$c === void 0 || _tabViewCarouselRef$c.jumpToRoute(routeKey);
  }, []);
  (0, _react.useImperativeHandle)(ref, () => ({
    jumpTo
  }), [jumpTo]);

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
    renderHeader: undefined,
    // No header in static mode
    onIndexChange,
    onSwipeEnd,
    onSwipeStart,
    // Pull-to-refresh (for static mode, content handles this)
    refreshing,
    onRefresh,
    refreshControlColor
  }), [navigationState, renderMode, tabBarType, tabBarPosition, tabBarScrollEnabled, tabBarDynamicWidthEnabled, scrollableTabWidth, tabBarStyle, tabBarIndicatorStyle, tabStyle, tabLabelStyle, swipeEnabled, jumpMode, sceneContainerGap, sceneContainerStyle, tabViewCarouselStyle, keyboardDismissMode, providedAnimatedRouteIndexSV, renderTabBar, renderScene, onIndexChange, onSwipeEnd, onSwipeStart, refreshing, onRefresh, refreshControlColor]);
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
  return /*#__PURE__*/_react.default.createElement(_Props.PropsContextProvider, {
    value: propsContextValue
  }, /*#__PURE__*/_react.default.createElement(_Internal.InternalContextProvider, {
    value: internalContextValue
  }, /*#__PURE__*/_react.default.createElement(_TabLayout.TabLayoutContextProvider, null, /*#__PURE__*/_react.default.createElement(_Header.HeaderContextProvider, null, /*#__PURE__*/_react.default.createElement(StaticTabViewContent, null)))));
}));

/**
 * TabView - Main entry point
 *
 * Automatically chooses between:
 * - CollapsibleTabView: when renderHeader is provided (new native scroll architecture)
 * - StaticTabView: when no header (simple fixed tab bar)
 */
const TabView = exports.TabView = /*#__PURE__*/_react.default.memo( /*#__PURE__*/_react.default.forwardRef((props, ref) => {
  const {
    renderHeader
  } = props;

  // Use new CollapsibleTabView for collapsible header mode
  if (renderHeader) {
    return /*#__PURE__*/_react.default.createElement(_CollapsibleTabView.CollapsibleTabView, _extends({}, props, {
      ref: ref
    }));
  }

  // Use StaticTabView for non-collapsible mode
  return /*#__PURE__*/_react.default.createElement(StaticTabView, _extends({}, props, {
    ref: ref
  }));
}));
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden'
  },
  contentWrapper: {
    flex: 1
  }
});
//# sourceMappingURL=TabView.js.map