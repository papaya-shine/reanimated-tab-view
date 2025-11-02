"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useGestureContentTranslateYStyle = void 0;
var _reactNativeReanimated = require("react-native-reanimated");
var _Header = require("../../providers/Header");
const useGestureContentTranslateYStyle = () => {
  const {
    animatedTranslateYSV
  } = (0, _Header.useHeaderContext)();
  return (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    return {
      transform: [{
        translateY: -animatedTranslateYSV.value
      }]
    };
  });
};
exports.useGestureContentTranslateYStyle = useGestureContentTranslateYStyle;
//# sourceMappingURL=useGestureContentTranslateYStyle.js.map