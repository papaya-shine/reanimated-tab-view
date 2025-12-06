import { type SharedValue } from 'react-native-reanimated';
/**
 * Helper to check if refresh can be triggered
 */
export declare const canTriggerRefresh: (onRefresh: (() => void) | undefined, refreshing: boolean | undefined, isTriggered: boolean | undefined) => boolean;
/**
 * Animates refresh overscroll back to zero
 */
export declare const animateRefreshOverscrollToZero: (refreshOverscrollSV: SharedValue<number>) => void;
//# sourceMappingURL=useRefreshHelpers.d.ts.map