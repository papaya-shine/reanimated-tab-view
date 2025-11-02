"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useScrollHandlers = void 0;
var _reactNativeReanimated = require("react-native-reanimated");
var _react = require("react");
var _scrollable = require("../../constants/scrollable");
var _Header = require("../../providers/Header");
var _SceneRenderer = require("../../providers/SceneRenderer");
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
    gestureSourceSV
  } = (0, _Header.useHeaderContext)();
  const {
    isRouteFocused,
    scrollYSV
  } = (0, _SceneRenderer.useSceneRendererContext)();
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
      animatedTranslateYSV.value = Math.min(Math.max(event.contentOffset.y, translateYBounds.lower), translateYBounds.upper);
    }
  }, [animatedTranslateYSV, gestureSourceSV, translateYBounds, isRouteFocused, scrollYSV]);
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