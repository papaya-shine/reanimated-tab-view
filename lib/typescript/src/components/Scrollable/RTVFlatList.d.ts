import React, { type ForwardedRef } from 'react';
import Animated from 'react-native-reanimated';
import type { FlatListProps } from 'react-native';
/**
 * RTVFlatList - FlatList component for use within TabView
 *
 * In COLLAPSIBLE mode:
 * - scrollEnabled={false} - outer ScrollView handles all gestures
 * - Reports content height to context (keyed by route)
 * - Syncs scroll position from outer scroll via useAnimatedReaction
 * - Viewport height comes from parent container, NOT from FlatList's onLayout
 *   (because with scrollEnabled={false}, FlatList expands to fit content)
 *
 * In STATIC mode:
 * - Normal scrolling behavior
 * - Can have its own RefreshControl
 */
declare function RTVFlatListInner<T>(props: FlatListProps<T> & {
    routeKey?: string;
}, ref: React.ForwardedRef<Animated.FlatList<T>>): JSX.Element;
export declare const RTVFlatList: <T>(props: FlatListProps<T> & {
    ref?: React.ForwardedRef<Animated.FlatList<T>> | undefined;
    routeKey?: string | undefined;
}) => ReturnType<typeof RTVFlatListInner>;
export {};
//# sourceMappingURL=RTVFlatList.d.ts.map