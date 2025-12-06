import { withTiming, type SharedValue } from 'react-native-reanimated';
import { REFRESH_ANIMATION_CONFIG } from '../../constants/refresh';

/**
 * Helper to check if refresh can be triggered
 */
export const canTriggerRefresh = (
  onRefresh: (() => void) | undefined,
  refreshing: boolean | undefined,
  isTriggered: boolean | undefined
): boolean => {
  'worklet';
  return !!(onRefresh && !refreshing && !isTriggered);
};

/**
 * Animates refresh overscroll back to zero
 */
export const animateRefreshOverscrollToZero = (
  refreshOverscrollSV: SharedValue<number>
) => {
  'worklet';
  refreshOverscrollSV.value = withTiming(0, REFRESH_ANIMATION_CONFIG);
};

