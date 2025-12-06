import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { cancelAnimation, runOnJS, useSharedValue, withDecay } from 'react-native-reanimated';
import { DECELERATION_RATE_FOR_SCROLLVIEW, GestureSource } from '../../constants/scrollable';
import { REFRESH_TRIGGER_THRESHOLD, REFRESH_RESISTANCE_FACTOR } from '../../constants/refresh';
import { canTriggerRefresh, animateRefreshOverscrollToZero } from './useRefreshHelpers';
import { useHeaderContext } from '../../providers/Header';
import { usePropsContext } from '../../providers/Props';
const ACTIVE_OFFSET_Y = [-10, 10];
export const useScrollLikePanGesture = () => {
  const {
    animatedTranslateYSV,
    gestureSourceSV,
    translateYBounds,
    refreshOverscrollSV,
    isRefreshTriggeredSV
  } = useHeaderContext();
  const {
    onRefresh,
    refreshing
  } = usePropsContext();
  const initialTranslateYSV = useSharedValue(0);
  const scrollLikePanGesture = useMemo(() => {
    const triggerRefresh = () => {
      if (onRefresh) {
        onRefresh();
      }
    };
    const gesture = Gesture.Pan().activeOffsetY(ACTIVE_OFFSET_Y).onTouchesDown(() => {
      cancelAnimation(animatedTranslateYSV);
      cancelAnimation(refreshOverscrollSV);
    }).onStart(() => {
      initialTranslateYSV.value = animatedTranslateYSV.value;
      gestureSourceSV.value = GestureSource.PAN;
    }).onChange(event => {
      const newTranslateY = initialTranslateYSV.value - event.translationY;

      // Check if we're at the top (header fully expanded) and pulling down
      if (newTranslateY < translateYBounds.lower && canTriggerRefresh(onRefresh, refreshing, isRefreshTriggeredSV.value)) {
        // Track overscroll for pull-to-refresh (with resistance)
        const overscroll = translateYBounds.lower - newTranslateY;
        refreshOverscrollSV.value = overscroll * REFRESH_RESISTANCE_FACTOR;

        // Check if threshold exceeded
        if (refreshOverscrollSV.value >= REFRESH_TRIGGER_THRESHOLD) {
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
        runOnJS(triggerRefresh)();
      }

      // Reset refresh state
      isRefreshTriggeredSV.value = false;

      // Animate overscroll back to 0 (no bounce)
      animateRefreshOverscrollToZero(refreshOverscrollSV);

      // Normal decay animation for header
      animatedTranslateYSV.value = withDecay({
        velocity: -event.velocityY,
        deceleration: DECELERATION_RATE_FOR_SCROLLVIEW,
        clamp: [translateYBounds.lower, translateYBounds.upper]
      });
    });
    return gesture;
  }, [animatedTranslateYSV, gestureSourceSV, initialTranslateYSV, translateYBounds, refreshOverscrollSV, isRefreshTriggeredSV, onRefresh, refreshing]);
  return scrollLikePanGesture;
};
//# sourceMappingURL=useScrollLikePanGesture.js.map