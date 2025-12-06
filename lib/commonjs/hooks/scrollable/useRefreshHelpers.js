"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canTriggerRefresh = exports.animateRefreshOverscrollToZero = void 0;
var _reactNativeReanimated = require("react-native-reanimated");
var _refresh = require("../../constants/refresh");
/**
 * Helper to check if refresh can be triggered
 */
const canTriggerRefresh = (onRefresh, refreshing, isTriggered) => {
  'worklet';

  return !!(onRefresh && !refreshing && !isTriggered);
};

/**
 * Animates refresh overscroll back to zero
 */
exports.canTriggerRefresh = canTriggerRefresh;
const animateRefreshOverscrollToZero = refreshOverscrollSV => {
  'worklet';

  refreshOverscrollSV.value = (0, _reactNativeReanimated.withTiming)(0, _refresh.REFRESH_ANIMATION_CONFIG);
};
exports.animateRefreshOverscrollToZero = animateRefreshOverscrollToZero;
//# sourceMappingURL=useRefreshHelpers.js.map