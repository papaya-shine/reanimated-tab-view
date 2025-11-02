/// <reference types="react-native-reanimated" />
import React from 'react';
import { type TabViewMethods } from '../types/TabView';
import type { Layout } from '../types/common';
export declare const TabViewWithoutProviders: React.MemoExoticComponent<() => JSX.Element>;
export declare const TabView: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<import("react-native").ViewProps, "children"> & {
    onIndexChange: (index: number) => void;
    navigationState: import("../types/common").NavigationState;
    renderScene: (props: import("../types/common").SceneRendererProps) => React.ReactNode;
    animatedRouteIndex?: import("react-native-reanimated").SharedValue<number> | undefined;
    tabBarConfig?: import("../types/TabView").TabBarConfig | undefined;
    jumpMode?: import("../types/TabView").JumpMode | undefined;
    initialLayout?: {
        tabView?: Partial<Layout> | undefined;
        tabViewHeader?: Partial<Layout> | undefined;
        tabBar?: Partial<Layout> | undefined;
    } | undefined;
    sceneContainerStyle?: import("react-native").StyleProp<import("react-native").ViewStyle>;
    tabViewCarouselStyle?: import("react-native").StyleProp<import("react-native").ViewStyle>;
    sceneContainerGap?: number | undefined;
    style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
    keyboardDismissMode?: import("../types/TabView").KeyboardDismissMode | undefined;
    swipeEnabled?: boolean | undefined;
    renderMode?: import("../types/TabView").RenderMode | undefined;
    renderHeader?: ((props: import("../types/common").HeaderRendererProps) => React.ReactNode) | undefined;
    onSwipeStart?: (() => void) | undefined;
    onSwipeEnd?: (() => void) | undefined;
} & React.RefAttributes<TabViewMethods>>>;
//# sourceMappingURL=TabView.d.ts.map