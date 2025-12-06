function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import React, { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import TabViewCarousel from './TabViewCarousel';
import { TabBar } from './TabBar';
import { TabLayoutContextProvider } from '../providers/TabLayout';
import { InternalContextProvider, useInternalContext } from '../providers/Internal';
import { PropsContextProvider, usePropsContext } from '../providers/Props';
import { SCROLLABLE_TAB_WIDTH, TAB_BAR_HEIGHT } from '../constants/tabBar';
import useHandleIndexChange from '../hooks/useHandlerIndexChange';
import { HeaderContextProvider } from '../providers/Header';
import { CollapsibleTabView } from './CollapsibleTabView';

/**
 * StaticTabViewContent - For non-collapsible mode (no renderHeader)
 * 
 * In this mode:
 * - Tab bar is fixed at top/bottom
 * - No header to collapse
 * - RefreshControl is handled per-tab in the content (via RTVFlatList/RTVScrollView)
 */
const StaticTabViewContent = /*#__PURE__*/React.memo(() => {
  const {
    tabBarPosition,
    tabBarStyle,
    tabStyle,
    tabLabelStyle,
    renderTabBar
  } = usePropsContext();
  const {
    tabViewLayout,
    tabViewCarouselRef,
    setTabViewLayout
  } = useInternalContext();
  const containerLayoutStyle = useMemo(() => {
    const width = (tabViewLayout === null || tabViewLayout === void 0 ? void 0 : tabViewLayout.width) || '100%';
    return {
      width
    };
  }, [tabViewLayout]);
  useHandleIndexChange();
  const onTabViewLayout = useCallback(({
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
  const tabBar = useMemo(() => {
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
  return /*#__PURE__*/React.createElement(View, {
    style: [styles.container, containerLayoutStyle],
    onLayout: onTabViewLayout
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.contentWrapper
  }, tabBarPosition === 'top' && tabBar, /*#__PURE__*/React.createElement(TabViewCarousel, {
    ref: tabViewCarouselRef
  }), tabBarPosition === 'bottom' && tabBar));
});

/**
 * StaticTabView - Wrapper with providers for non-collapsible mode
 */
const StaticTabView = /*#__PURE__*/React.memo( /*#__PURE__*/React.forwardRef((props, ref) => {
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
  const tabViewCarouselRef = useRef(null);
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
  const jumpTo = useCallback(routeKey => {
    var _tabViewCarouselRef$c;
    (_tabViewCarouselRef$c = tabViewCarouselRef.current) === null || _tabViewCarouselRef$c === void 0 || _tabViewCarouselRef$c.jumpToRoute(routeKey);
  }, []);
  useImperativeHandle(ref, () => ({
    jumpTo
  }), [jumpTo]);

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
  return /*#__PURE__*/React.createElement(PropsContextProvider, {
    value: propsContextValue
  }, /*#__PURE__*/React.createElement(InternalContextProvider, {
    value: internalContextValue
  }, /*#__PURE__*/React.createElement(TabLayoutContextProvider, null, /*#__PURE__*/React.createElement(HeaderContextProvider, null, /*#__PURE__*/React.createElement(StaticTabViewContent, null)))));
}));

/**
 * TabView - Main entry point
 * 
 * Automatically chooses between:
 * - CollapsibleTabView: when renderHeader is provided (new native scroll architecture)
 * - StaticTabView: when no header (simple fixed tab bar)
 */
export const TabView = /*#__PURE__*/React.memo( /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    renderHeader
  } = props;

  // Use new CollapsibleTabView for collapsible header mode
  if (renderHeader) {
    return /*#__PURE__*/React.createElement(CollapsibleTabView, _extends({}, props, {
      ref: ref
    }));
  }

  // Use StaticTabView for non-collapsible mode
  return /*#__PURE__*/React.createElement(StaticTabView, _extends({}, props, {
    ref: ref
  }));
}));
const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden'
  },
  contentWrapper: {
    flex: 1
  }
});
//# sourceMappingURL=TabView.js.map