import {
  cancelAnimation,
  runOnJS,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useCallback } from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
} from 'react-native';
import { GestureSource } from '../../constants/scrollable';
import {
  REFRESH_SCROLL_THRESHOLD,
  REFRESH_RESISTANCE_FACTOR,
} from '../../constants/refresh';
import {
  canTriggerRefresh,
  animateRefreshOverscrollToZero,
} from './useRefreshHelpers';
import { useHeaderContext } from '../../providers/Header';
import { useSceneRendererContext } from '../../providers/SceneRenderer';
import { usePropsContext } from '../../providers/Props';

export const useScrollHandlers = ({
  onScroll: _onScroll,
  onScrollEndDrag: _onScrollEndDrag,
  onScrollBeginDrag: _onScrollBeginDrag,
  onMomentumScrollEnd: _onMomentumScrollEnd,
  onMomentumScrollBegin: _onMomentumScrollBegin,
}: Pick<
  ScrollViewProps,
  | 'onScroll'
  | 'onScrollEndDrag'
  | 'onScrollBeginDrag'
  | 'onMomentumScrollEnd'
  | 'onMomentumScrollBegin'
>) => {
  const { animatedTranslateYSV, translateYBounds, gestureSourceSV, refreshOverscrollSV, isRefreshTriggeredSV } =
    useHeaderContext();

  const { isRouteFocused, scrollYSV } = useSceneRendererContext();
  
  const { onRefresh, refreshing } = usePropsContext();

  const onBeginDrag = useCallback(() => {
    'worklet';
    if (!isRouteFocused) {
      return;
    }
    cancelAnimation(animatedTranslateYSV);
    gestureSourceSV.value = GestureSource.SCROLL;
  }, [animatedTranslateYSV, gestureSourceSV, isRouteFocused]);

  const onScroll = useCallback(
    (event: NativeScrollEvent) => {
      'worklet';
      scrollYSV.value = event.contentOffset.y;
      
      if (!isRouteFocused) {
        return;
      }
      if (gestureSourceSV.value === GestureSource.SCROLL) {
        // Check for pull-to-refresh overscroll (negative contentOffset.y)
        // NOTE: This only works on iOS. On Android, contentOffset.y doesn't go negative
        // on overscroll. Android users should pull from the header to trigger refresh.
        if (
          event.contentOffset.y < 0 &&
          canTriggerRefresh(onRefresh, refreshing, isRefreshTriggeredSV.value)
        ) {
          // Track overscroll for refresh (with resistance)
          const overscroll =
            Math.abs(event.contentOffset.y) * REFRESH_RESISTANCE_FACTOR;
          refreshOverscrollSV.value = overscroll;

          // Check if threshold exceeded (using smaller threshold for content pull)
          if (overscroll >= REFRESH_SCROLL_THRESHOLD) {
            isRefreshTriggeredSV.value = true;
          }
        } else if (event.contentOffset.y >= 0) {
          // Normal header collapse behavior (only when not in overscroll)
          animatedTranslateYSV.value = Math.min(
            Math.max(event.contentOffset.y, translateYBounds.lower),
            translateYBounds.upper
          );
        }
        // If refreshing or triggered, don't update anything - let it stay as is
      }
    },
    [
      animatedTranslateYSV,
      gestureSourceSV,
      translateYBounds,
      isRouteFocused,
      scrollYSV,
      onRefresh,
      refreshing,
      refreshOverscrollSV,
      isRefreshTriggeredSV,
    ]
  );

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      onScroll(event);
      if (_onScroll) {
        runOnJS(_onScroll)({
          nativeEvent: event,
        } as unknown as NativeSyntheticEvent<NativeScrollEvent>);
      }
    },
    onBeginDrag: (event) => {
      onBeginDrag();
      if (_onScrollBeginDrag) {
        runOnJS(_onScrollBeginDrag)({
          nativeEvent: event,
        } as unknown as NativeSyntheticEvent<NativeScrollEvent>);
      }
    },
    onEndDrag: (event) => {
      const wasTriggered = isRefreshTriggeredSV.value;

      // Check if refresh was triggered during scroll (iOS only)
      if (wasTriggered && onRefresh && !refreshing) {
        runOnJS(onRefresh)();
        // Keep spinner visible while refreshing - don't animate back to 0
        // The spinner will hide when refreshing becomes false
      } else {
        // Only animate back to 0 if refresh wasn't triggered
        animateRefreshOverscrollToZero(refreshOverscrollSV);
      }

      // Reset refresh state
      isRefreshTriggeredSV.value = false;
      
      if (_onScrollEndDrag) {
        runOnJS(_onScrollEndDrag)({
          nativeEvent: event,
        } as unknown as NativeSyntheticEvent<NativeScrollEvent>);
      }
    },
    onMomentumEnd: (event) => {
      if (_onMomentumScrollEnd) {
        runOnJS(_onMomentumScrollEnd)({
          nativeEvent: event,
        } as unknown as NativeSyntheticEvent<NativeScrollEvent>);
      }
    },
    onMomentumBegin: (event) => {
      if (_onMomentumScrollBegin) {
        runOnJS(_onMomentumScrollBegin)({
          nativeEvent: event,
        } as unknown as NativeSyntheticEvent<NativeScrollEvent>);
      }
    },
  });

  return handleScroll;
};
