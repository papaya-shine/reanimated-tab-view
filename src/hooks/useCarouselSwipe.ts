import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  runOnJS,
  runOnUI,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { AUTO_SWIPE_COMPLETION_DURATION } from '../constants/carousel';
import { useInternalContext } from '../providers/Internal';
import { usePropsContext } from '../providers/Props';
import { useJumpContext } from '../providers/Jump';
import { useCarouselContext } from '../providers/Carousel';

// Horizontal distance needed to activate swipe gesture
const ACTIVE_OFFSET_X: [number, number] = Platform.select({
  ios: [-10, 10],
  android: [-10, 10], // Lower = activates sooner (try 10-20)
  default: [-10, 10],
});

// Vertical distance that cancels the swipe (for scroll conflict on Android)
const FAIL_OFFSET_Y: [number, number] = Platform.select({
  ios: [-1000, 1000], // Effectively disabled on iOS
  android: [-20, 20], // Higher = more forgiving for diagonal swipes (try 15-30)
  default: [-1000, 1000],
});

export const useCarouselSwipePanGesture = (
  updateCurrentRouteIndex: (value: number) => void,
  handleSwipeStart: () => void,
  handleSwipeEnd: () => void
) => {
  const {
    currentRouteIndexSV,
    swipeTranslationXSV,
    translationPerSceneContainer,
  } = useCarouselContext();

  const preSwipeStartswipeTranslationXSV = useSharedValue(0);

  const { noOfRoutes, animatedRouteIndex } = useInternalContext();
  const { swipeEnabled } = usePropsContext();
  const {
    isJumping,
    smoothJumpStartRouteIndexSV,
    setSmoothJumpStartRouteIndex,
  } = useJumpContext();

  const minRouteIndex = 0;
  const maxRouteIndex = noOfRoutes - 1;
  const minswipeTranslationXSV = minRouteIndex * translationPerSceneContainer;
  const maxswipeTranslationXSV = maxRouteIndex * translationPerSceneContainer;

  const gestureEnabled = useMemo(
    () => !isJumping && swipeEnabled,
    [swipeEnabled, isJumping]
  );

  const swipePanGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(gestureEnabled)
        .activeOffsetX(ACTIVE_OFFSET_X)
        .failOffsetY(FAIL_OFFSET_Y)
        .onStart(() => {
          preSwipeStartswipeTranslationXSV.value = swipeTranslationXSV.value;
          runOnJS(handleSwipeStart)();
        })
        .onUpdate(({ translationX }) => {
          const boundedTranslationX = Math.min(
            Math.max(translationX, -translationPerSceneContainer),
            translationPerSceneContainer
          );
          swipeTranslationXSV.value = Math.min(
            Math.max(
              preSwipeStartswipeTranslationXSV.value + boundedTranslationX,
              -1 * maxswipeTranslationXSV
            ),
            -1 * minswipeTranslationXSV
          );
          animatedRouteIndex.value =
            -swipeTranslationXSV.value / translationPerSceneContainer;
        })
        .onEnd(({ translationX, velocityX }) => {
          const currentRouteIndex = currentRouteIndexSV.value;
          const shouldInertiallySnapBackToCurrentRouteIndex =
            Math.round(
              -(swipeTranslationXSV.value + velocityX) /
                translationPerSceneContainer
            ) === currentRouteIndex;

          if (shouldInertiallySnapBackToCurrentRouteIndex) {
            swipeTranslationXSV.value = withTiming(
              -currentRouteIndex * translationPerSceneContainer,
              {
                duration: AUTO_SWIPE_COMPLETION_DURATION,
                easing: Easing.out(Easing.ease),
              }
            );
            animatedRouteIndex.value = withTiming(currentRouteIndex, {
              duration: AUTO_SWIPE_COMPLETION_DURATION,
              easing: Easing.out(Easing.ease),
            });
            runOnJS(handleSwipeEnd)();
            return;
          }

          let routeIndexToInertiallySnap: number;
          const leftSwipe = translationX > 0;
          if (leftSwipe) {
            routeIndexToInertiallySnap = Math.max(
              minRouteIndex,
              currentRouteIndex - 1
            );
          } else {
            routeIndexToInertiallySnap = Math.min(
              maxRouteIndex,
              currentRouteIndex + 1
            );
          }
          animatedRouteIndex.value = withTiming(routeIndexToInertiallySnap, {
            duration: AUTO_SWIPE_COMPLETION_DURATION,
            easing: Easing.out(Easing.ease),
          });

          swipeTranslationXSV.value = withTiming(
            -routeIndexToInertiallySnap * translationPerSceneContainer,
            {
              duration: AUTO_SWIPE_COMPLETION_DURATION,
              easing: Easing.out(Easing.ease),
            },
            () => {
              smoothJumpStartRouteIndexSV.value = routeIndexToInertiallySnap;
              runOnJS(setSmoothJumpStartRouteIndex)(routeIndexToInertiallySnap);
            }
          );

          currentRouteIndexSV.value = routeIndexToInertiallySnap;
          runOnJS(updateCurrentRouteIndex)(routeIndexToInertiallySnap);
          runOnJS(handleSwipeEnd)();
        }),
    [
      gestureEnabled,
      preSwipeStartswipeTranslationXSV,
      swipeTranslationXSV,
      handleSwipeStart,
      translationPerSceneContainer,
      maxswipeTranslationXSV,
      minswipeTranslationXSV,
      animatedRouteIndex,
      currentRouteIndexSV,
      updateCurrentRouteIndex,
      handleSwipeEnd,
      maxRouteIndex,
      smoothJumpStartRouteIndexSV,
      setSmoothJumpStartRouteIndex,
    ]
  );

  return swipePanGesture;
};

export const useCarouselJumpToIndex = (
  updateCurrentRouteIndex: (value: number) => void
) => {
  const {
    currentRouteIndexSV,
    swipeTranslationXSV,
    translationPerSceneContainer,
  } = useCarouselContext();

  const { routes, noOfRoutes, animatedRouteIndex } = useInternalContext();
  const { jumpMode } = usePropsContext();
  const {
    smoothJumpStartRouteIndexSV,
    setSmoothJumpStartRouteIndex,
    smoothJumpStartRouteTranslationXSV,
    jumpEndRouteIndexSV,
    setIsJumping,
  } = useJumpContext();

  const minRouteIndex = 0;
  const maxRouteIndex = noOfRoutes - 1;

  const jumpToRoute = useCallback(
    (key: string) => {
      const routeIndexToJumpTo = routes.findIndex((route) => route.key === key);
      /** Only jump if route is in between the min and max ranges */
      if (
        routeIndexToJumpTo === -1 ||
        routeIndexToJumpTo < minRouteIndex ||
        routeIndexToJumpTo > maxRouteIndex
      ) {
        return;
      }

      runOnUI(() => {
        'worklet';
        const currentRouteIndex = currentRouteIndexSV.value;

        /** Only jump if not equal to current route index */
        if (routeIndexToJumpTo === currentRouteIndex) {
          return;
        }

        runOnJS(setIsJumping)(true);
        jumpEndRouteIndexSV.value = routeIndexToJumpTo;

        /** For smooth jump, translate to the adjacent route of the route to jump to */
        if (jumpMode === 'smooth') {
          const shouldJumpLeft = routeIndexToJumpTo > currentRouteIndex;
          let tempRouteIndexToJumpTo: number;
          if (shouldJumpLeft) {
            tempRouteIndexToJumpTo = routeIndexToJumpTo - 1;
          } else {
            tempRouteIndexToJumpTo = routeIndexToJumpTo + 1;
          }
          swipeTranslationXSV.value =
            -tempRouteIndexToJumpTo * translationPerSceneContainer;
          smoothJumpStartRouteTranslationXSV.value =
            (tempRouteIndexToJumpTo - currentRouteIndex) *
            translationPerSceneContainer;
        }

        currentRouteIndexSV.value = routeIndexToJumpTo;
        runOnJS(updateCurrentRouteIndex)(routeIndexToJumpTo);

        if (jumpMode !== 'no-animation') {
          animatedRouteIndex.value = withTiming(routeIndexToJumpTo, {
            duration: AUTO_SWIPE_COMPLETION_DURATION,
            easing: Easing.ease,
          });
          swipeTranslationXSV.value = withTiming(
            -routeIndexToJumpTo * translationPerSceneContainer,
            {
              duration: AUTO_SWIPE_COMPLETION_DURATION,
              easing: Easing.ease,
            },
            () => {
              jumpEndRouteIndexSV.value = null;
              smoothJumpStartRouteIndexSV.value = routeIndexToJumpTo;
              smoothJumpStartRouteTranslationXSV.value = 0;
              runOnJS(setSmoothJumpStartRouteIndex)(routeIndexToJumpTo);
              runOnJS(setIsJumping)(false);
            }
          );
        } else {
          animatedRouteIndex.value = routeIndexToJumpTo;
          swipeTranslationXSV.value =
            -routeIndexToJumpTo * translationPerSceneContainer;
          jumpEndRouteIndexSV.value = null;
          smoothJumpStartRouteIndexSV.value = routeIndexToJumpTo;
          smoothJumpStartRouteTranslationXSV.value = 0;
          runOnJS(setSmoothJumpStartRouteIndex)(routeIndexToJumpTo);
          runOnJS(setIsJumping)(false);
        }
      })();
    },
    [
      currentRouteIndexSV,
      routes,
      maxRouteIndex,
      setIsJumping,
      jumpEndRouteIndexSV,
      jumpMode,
      updateCurrentRouteIndex,
      animatedRouteIndex,
      swipeTranslationXSV,
      translationPerSceneContainer,
      smoothJumpStartRouteTranslationXSV,
      smoothJumpStartRouteIndexSV,
      setSmoothJumpStartRouteIndex,
    ]
  );

  return jumpToRoute;
};

export const useCarouselSwipeTranslationAnimatedStyle = () => {
  const { swipeTranslationXSV } = useCarouselContext();

  const swipeTranslationAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: swipeTranslationXSV.value }],
    }),
    [swipeTranslationXSV]
  );
  return swipeTranslationAnimatedStyle;
};
