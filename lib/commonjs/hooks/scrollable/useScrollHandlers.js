"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useScrollHandlers = void 0;
var _reactNativeReanimated = require("react-native-reanimated");
var _react = require("react");
var _scrollable = require("../../constants/scrollable");
var _refresh = require("../../constants/refresh");
var _useRefreshHelpers = require("./useRefreshHelpers");
var _Header = require("../../providers/Header");
var _SceneRenderer = require("../../providers/SceneRenderer");
var _Props = require("../../providers/Props");
const useScrollHandlers = ({
  onScroll: _onScroll,
  onScrollEndDrag: _onScrollEndDrag,
  onScrollBeginDrag: _onScrollBeginDrag,
  onMomentumScrollEnd: _onMomentumScrollEnd,
  onMomentumScrollBegin: _onMomentumScrollBegin
}) => {
  const {
    animatedTranslateYSV,
    translateYBounds,
    gestureSourceSV,
    refreshOverscrollSV,
    isRefreshTriggeredSV
  } = (0, _Header.useHeaderContext)();
  const {
    isRouteFocused,
    scrollYSV
  } = (0, _SceneRenderer.useSceneRendererContext)();
  const {
    onRefresh,
    refreshing
  } = (0, _Props.usePropsContext)();
  const onBeginDrag = (0, _react.useCallback)(() => {
    'worklet';

    if (!isRouteFocused) {
      return;
    }
    (0, _reactNativeReanimated.cancelAnimation)(animatedTranslateYSV);
    gestureSourceSV.value = _scrollable.GestureSource.SCROLL;
  }, [animatedTranslateYSV, gestureSourceSV, isRouteFocused]);
  const onScroll = (0, _react.useCallback)(event => {
    'worklet';

    scrollYSV.value = event.contentOffset.y;
    if (!isRouteFocused) {
      return;
    }
    if (gestureSourceSV.value === _scrollable.GestureSource.SCROLL) {
      // Check for pull-to-refresh overscroll (negative contentOffset.y)
      // NOTE: This only works on iOS. On Android, contentOffset.y doesn't go negative
      // on overscroll. Android users should pull from the header to trigger refresh.
      if (event.contentOffset.y < 0 && (0, _useRefreshHelpers.canTriggerRefresh)(onRefresh, refreshing, isRefreshTriggeredSV.value)) {
        // Track overscroll for refresh (with resistance)
        const overscroll = Math.abs(event.contentOffset.y) * _refresh.REFRESH_RESISTANCE_FACTOR;
        refreshOverscrollSV.value = overscroll;

        // Check if threshold exceeded (using smaller threshold for content pull)
        if (overscroll >= _refresh.REFRESH_SCROLL_THRESHOLD) {
          isRefreshTriggeredSV.value = true;
        }
      } else if (event.contentOffset.y >= 0) {
        // Normal header collapse behavior (only when not in overscroll)
        animatedTranslateYSV.value = Math.min(Math.max(event.contentOffset.y, translateYBounds.lower), translateYBounds.upper);
      }
      // If refreshing or triggered, don't update anything - let it stay as is
    }
  }, [animatedTranslateYSV, gestureSourceSV, translateYBounds, isRouteFocused, scrollYSV, onRefresh, refreshing, refreshOverscrollSV, isRefreshTriggeredSV]);
  const handleScroll = (0, _reactNativeReanimated.useAnimatedScrollHandler)({
    onScroll: event => {
      onScroll(event);
      if (_onScroll) {
        (0, _reactNativeReanimated.runOnJS)(_onScroll)({
          nativeEvent: event
        });
      }
    },
    onBeginDrag: event => {
      onBeginDrag();
      if (_onScrollBeginDrag) {
        (0, _reactNativeReanimated.runOnJS)(_onScrollBeginDrag)({
          nativeEvent: event
        });
      }
    },
    onEndDrag: event => {
      const wasTriggered = isRefreshTriggeredSV.value;

      // Check if refresh was triggered during scroll (iOS only)
      if (wasTriggered && onRefresh && !refreshing) {
        (0, _reactNativeReanimated.runOnJS)(onRefresh)();
        // Keep spinner visible while refreshing - don't animate back to 0
        // The spinner will hide when refreshing becomes false
      } else {
        // Only animate back to 0 if refresh wasn't triggered
        (0, _useRefreshHelpers.animateRefreshOverscrollToZero)(refreshOverscrollSV);
      }

      // Reset refresh state
      isRefreshTriggeredSV.value = false;
      if (_onScrollEndDrag) {
        (0, _reactNativeReanimated.runOnJS)(_onScrollEndDrag)({
          nativeEvent: event
        });
      }
    },
    onMomentumEnd: event => {
      if (_onMomentumScrollEnd) {
        (0, _reactNativeReanimated.runOnJS)(_onMomentumScrollEnd)({
          nativeEvent: event
        });
      }
    },
    onMomentumBegin: event => {
      if (_onMomentumScrollBegin) {
        (0, _reactNativeReanimated.runOnJS)(_onMomentumScrollBegin)({
          nativeEvent: event
        });
      }
    }
  });
  return handleScroll;
};
exports.useScrollHandlers = useScrollHandlers;
//# sourceMappingURL=useScrollHandlers.js.map