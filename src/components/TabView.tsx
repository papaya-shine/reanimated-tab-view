import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import TabViewCarousel, {
  type CarouselImperativeHandle,
} from './TabViewCarousel';
import { type TabViewMethods, type TabViewProps } from '../types/TabView';
import type { LayoutChangeEvent } from 'react-native';
import type { Layout } from '../types/common';
import { TabBar } from './TabBar';
import { TabLayoutContextProvider } from '../providers/TabLayout';
import {
  InternalContextProvider,
  useInternalContext,
} from '../providers/Internal';
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
const StaticTabViewContent = React.memo(() => {
  const { tabBarPosition, tabBarStyle, tabStyle, tabLabelStyle, renderTabBar } =
    usePropsContext();

  const { tabViewLayout, tabViewCarouselRef, setTabViewLayout } =
    useInternalContext();

  const containerLayoutStyle = useMemo(() => {
    const width: number | `${number}%` = tabViewLayout?.width || '100%';
    return { width };
  }, [tabViewLayout]);

  useHandleIndexChange();

  const onTabViewLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      const { width, height } = nativeEvent.layout;
      setTabViewLayout((prevLayout) => ({
        ...prevLayout,
        width,
        height,
      }));
    },
    [setTabViewLayout]
  );

  const tabBar = useMemo(() => {
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

  return (
    <View
      style={[styles.container, containerLayoutStyle]}
      onLayout={onTabViewLayout}
    >
      <View style={styles.contentWrapper}>
        {tabBarPosition === 'top' && tabBar}
        <TabViewCarousel ref={tabViewCarouselRef as React.Ref<CarouselImperativeHandle>} />
        {tabBarPosition === 'bottom' && tabBar}
      </View>
    </View>
  );
});

/**
 * StaticTabView - Wrapper with providers for non-collapsible mode
 */
const StaticTabView = React.memo(
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
      renderScene,
      onIndexChange,
      onSwipeEnd,
      onSwipeStart,
      // Pull-to-refresh props (for static mode, these are passed to content)
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

    const tabViewCarouselRef = useRef<CarouselImperativeHandle | null>(null);
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

    const jumpTo = useCallback((routeKey: string) => {
      tabViewCarouselRef.current?.jumpToRoute(routeKey);
    }, []);

    useImperativeHandle(ref, () => ({ jumpTo }), [jumpTo]);

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
        renderHeader: undefined, // No header in static mode
        onIndexChange,
        onSwipeEnd,
        onSwipeStart,
        // Pull-to-refresh (for static mode, content handles this)
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

    return (
      <PropsContextProvider value={propsContextValue}>
        <InternalContextProvider value={internalContextValue}>
          <TabLayoutContextProvider>
            <HeaderContextProvider>
              <StaticTabViewContent />
            </HeaderContextProvider>
          </TabLayoutContextProvider>
        </InternalContextProvider>
      </PropsContextProvider>
    );
  })
);

/**
 * TabView - Main entry point
 * 
 * Automatically chooses between:
 * - CollapsibleTabView: when renderHeader is provided (new native scroll architecture)
 * - StaticTabView: when no header (simple fixed tab bar)
 */
export const TabView = React.memo(
  React.forwardRef<TabViewMethods, TabViewProps>((props, ref) => {
    const { renderHeader } = props;

    // Use new CollapsibleTabView for collapsible header mode
    if (renderHeader) {
      return <CollapsibleTabView {...props} ref={ref} />;
    }

    // Use StaticTabView for non-collapsible mode
    return <StaticTabView {...props} ref={ref} />;
  })
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
  },
});
