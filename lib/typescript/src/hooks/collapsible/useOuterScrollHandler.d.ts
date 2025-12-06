import type { NativeScrollEvent } from 'react-native';
/**
 * Hook that handles the outer scroll view's scroll events.
 *
 * The outer scroll manages:
 * 1. Header collapse (scrolling the header away)
 * 2. Sticky tab bar behavior
 * 3. Triggering refresh when at top and pulling down
 */
export declare const useOuterScrollHandler: () => (event: import("react-native").NativeSyntheticEvent<NativeScrollEvent>) => void;
/**
 * Hook to get the animated style for the sticky tab bar.
 * The tab bar should stick at the top when the header is scrolled away.
 */
export declare const useStickyTabBarStyle: () => null;
//# sourceMappingURL=useOuterScrollHandler.d.ts.map