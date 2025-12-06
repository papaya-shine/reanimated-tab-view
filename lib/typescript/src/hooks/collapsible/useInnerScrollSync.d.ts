/// <reference types="react" />
import type { NativeScrollEvent } from 'react-native';
import type Animated from 'react-native-reanimated';
/**
 * Hook that synchronizes inner scroll (content) with outer scroll (header).
 *
 * Behavior:
 * 1. When outer scroll hasn't reached header height, inner scroll is locked at 0
 * 2. When outer scroll >= header height (header collapsed), inner scroll is free
 * 3. When inner scroll hits top (0) and user pulls down, transfer to outer scroll
 *
 * For tab switching:
 * - All tabs sync their scroll position relative to header collapse state
 * - When switching tabs, the new tab adjusts to match the header state
 */
export declare const useInnerScrollSync: (scrollRef: React.RefObject<Animated.ScrollView | Animated.FlatList<any>>) => {
    handleScroll: (event: import("react-native").NativeSyntheticEvent<NativeScrollEvent>) => void;
    scrollRef: import("react").RefObject<Animated.ScrollView | Animated.FlatList<any>>;
};
/**
 * Hook to check if inner scroll should be enabled.
 * Inner scroll is only enabled when header is fully collapsed.
 */
export declare const useIsInnerScrollEnabled: () => import("react-native-reanimated").SharedValue<boolean>;
//# sourceMappingURL=useInnerScrollSync.d.ts.map