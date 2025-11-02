import { cancelAnimation, runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useCallback } from 'react';
import { GestureSource } from '../../constants/scrollable';
import { useHeaderContext } from '../../providers/Header';
import { useSceneRendererContext } from '../../providers/SceneRenderer';
export const useScrollHandlers = ({
  onScroll: _onScroll,
  onScrollEndDrag: _onScrollEndDrag,
  onScrollBeginDrag: _onScrollBeginDrag,
  onMomentumScrollEnd: _onMomentumScrollEnd,
  onMomentumScrollBegin: _onMomentumScrollBegin
}) => {
  const {
    animatedTranslateYSV,
    translateYBounds,
    gestureSourceSV
  } = useHeaderContext();
  const {
    isRouteFocused,
    scrollYSV
  } = useSceneRendererContext();
  const onBeginDrag = useCallback(() => {
    'worklet';

    if (!isRouteFocused) {
      return;
    }
    cancelAnimation(animatedTranslateYSV);
    gestureSourceSV.value = GestureSource.SCROLL;
  }, [animatedTranslateYSV, gestureSourceSV, isRouteFocused]);
  const onScroll = useCallback(event => {
    'worklet';

    scrollYSV.value = event.contentOffset.y;
    if (!isRouteFocused) {
      return;
    }
    if (gestureSourceSV.value === GestureSource.SCROLL) {
      animatedTranslateYSV.value = Math.min(Math.max(event.contentOffset.y, translateYBounds.lower), translateYBounds.upper);
    }
  }, [animatedTranslateYSV, gestureSourceSV, translateYBounds, isRouteFocused, scrollYSV]);
  const handleScroll = useAnimatedScrollHandler({
    onScroll: event => {
      onScroll(event);
      if (_onScroll) {
        runOnJS(_onScroll)({
          nativeEvent: event
        });
      }
    },
    onBeginDrag: event => {
      onBeginDrag();
      if (_onScrollBeginDrag) {
        runOnJS(_onScrollBeginDrag)({
          nativeEvent: event
        });
      }
    },
    onEndDrag: event => {
      if (_onScrollEndDrag) {
        runOnJS(_onScrollEndDrag)({
          nativeEvent: event
        });
      }
    },
    onMomentumEnd: event => {
      if (_onMomentumScrollEnd) {
        runOnJS(_onMomentumScrollEnd)({
          nativeEvent: event
        });
      }
    },
    onMomentumBegin: event => {
      if (_onMomentumScrollBegin) {
        runOnJS(_onMomentumScrollBegin)({
          nativeEvent: event
        });
      }
    }
  });
  return handleScroll;
};
//# sourceMappingURL=useScrollHandlers.js.map