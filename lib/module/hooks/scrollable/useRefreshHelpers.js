import { withTiming } from 'react-native-reanimated';
import { REFRESH_ANIMATION_CONFIG } from '../../constants/refresh';

/**
 * Helper to check if refresh can be triggered
 */
export const canTriggerRefresh = (onRefresh, refreshing, isTriggered) => {
  'worklet';

  return !!(onRefresh && !refreshing && !isTriggered);
};

/**
 * Animates refresh overscroll back to zero
 */
export const animateRefreshOverscrollToZero = refreshOverscrollSV => {
  'worklet';

  refreshOverscrollSV.value = withTiming(0, REFRESH_ANIMATION_CONFIG);
};
//# sourceMappingURL=useRefreshHelpers.js.map