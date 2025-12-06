"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useScrollLikePanGesture = void 0;
var _react = require("react");
var _reactNativeGestureHandler = require("react-native-gesture-handler");
var _reactNativeReanimated = require("react-native-reanimated");
var _scrollable = require("../../constants/scrollable");
var _refresh = require("../../constants/refresh");
var _useRefreshHelpers = require("./useRefreshHelpers");
var _Header = require("../../providers/Header");
var _Props = require("../../providers/Props");
const ACTIVE_OFFSET_Y = [-10, 10];
const useScrollLikePanGesture = () => {
  const {
    animatedTranslateYSV,
    gestureSourceSV,
    translateYBounds,
    refreshOverscrollSV,
    isRefreshTriggeredSV
  } = (0, _Header.useHeaderContext)();
  const {
    onRefresh,
    refreshing
  } = (0, _Props.usePropsContext)();
  const initialTranslateYSV = (0, _reactNativeReanimated.useSharedValue)(0);
  const scrollLikePanGesture = (0, _react.useMemo)(() => {
    const triggerRefresh = () => {
      if (onRefresh) {
        onRefresh();
      }
    };
    const gesture = _reactNativeGestureHandler.Gesture.Pan().activeOffsetY(ACTIVE_OFFSET_Y).onTouchesDown(() => {
      (0, _reactNativeReanimated.cancelAnimation)(animatedTranslateYSV);
      (0, _reactNativeReanimated.cancelAnimation)(refreshOverscrollSV);
    }).onStart(() => {
      initialTranslateYSV.value = animatedTranslateYSV.value;
      gestureSourceSV.value = _scrollable.GestureSource.PAN;
    }).onChange(event => {
      const newTranslateY = initialTranslateYSV.value - event.translationY;

      // Check if we're at the top (header fully expanded) and pulling down
      if (newTranslateY < translateYBounds.lower && (0, _useRefreshHelpers.canTriggerRefresh)(onRefresh, refreshing, isRefreshTriggeredSV.value)) {
        // Track overscroll for pull-to-refresh (with resistance)
        const overscroll = translateYBounds.lower - newTranslateY;
        refreshOverscrollSV.value = overscroll * _refresh.REFRESH_RESISTANCE_FACTOR;

        // Check if threshold exceeded
        if (refreshOverscrollSV.value >= _refresh.REFRESH_TRIGGER_THRESHOLD) {
          isRefreshTriggeredSV.value = true;
        }

        // Keep header at top
        animatedTranslateYSV.value = translateYBounds.lower;
      } else {
        // Normal header collapse behavior
        refreshOverscrollSV.value = 0;
        animatedTranslateYSV.value = Math.min(Math.max(newTranslateY, translateYBounds.lower), translateYBounds.upper);
      }
    }).onEnd(event => {
      // If refresh was triggered, call the callback
      if (isRefreshTriggeredSV.value && onRefresh && !refreshing) {
        (0, _reactNativeReanimated.runOnJS)(triggerRefresh)();
      }

      // Reset refresh state
      isRefreshTriggeredSV.value = false;

      // Animate overscroll back to 0 (no bounce)
      (0, _useRefreshHelpers.animateRefreshOverscrollToZero)(refreshOverscrollSV);

      // Normal decay animation for header
      animatedTranslateYSV.value = (0, _reactNativeReanimated.withDecay)({
        velocity: -event.velocityY,
        deceleration: _scrollable.DECELERATION_RATE_FOR_SCROLLVIEW,
        clamp: [translateYBounds.lower, translateYBounds.upper]
      });
    });
    return gesture;
  }, [animatedTranslateYSV, gestureSourceSV, initialTranslateYSV, translateYBounds, refreshOverscrollSV, isRefreshTriggeredSV, onRefresh, refreshing]);
  return scrollLikePanGesture;
};
exports.useScrollLikePanGesture = useScrollLikePanGesture;
//# sourceMappingURL=useScrollLikePanGesture.js.map