import React from 'react';
import Animated from 'react-native-reanimated';
/**
 * RTVScrollViewWithoutScrollHandler
 *
 * In COLLAPSIBLE mode (renderHeader provided):
 * - Scroll is always enabled (nested scroll handles coordination)
 * - No RefreshControl (handled by outer scroll)
 *
 * In STATIC mode (no renderHeader):
 * - Normal scrolling behavior
 * - Can have its own RefreshControl (user-provided or from TabView props)
 */
export declare const RTVScrollViewWithoutScrollHandler: React.MemoExoticComponent<React.ForwardRefExoticComponent<import("react-native").ScrollViewProps & React.RefAttributes<React.ForwardedRef<Animated.ScrollView>>>>;
/**
 * RTVScrollView - With scroll handlers
 */
export declare const RTVScrollView: React.MemoExoticComponent<React.ForwardRefExoticComponent<import("react-native").ScrollViewProps & React.RefAttributes<React.ForwardedRef<Animated.ScrollView>>>>;
//# sourceMappingURL=RTVScrollView.d.ts.map