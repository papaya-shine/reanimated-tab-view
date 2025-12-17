import React, { useCallback, useMemo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { useHandleTabLayout } from '../hooks/useTabLayout';
import { useInternalContext } from '../providers/Internal';
const Tab = /*#__PURE__*/React.memo(({
  index,
  route,
  style,
  children,
  onTabPress,
  onTabLongPress
}) => {
  const {
    jumpTo
  } = useInternalContext();
  const {
    handleTabLayout
  } = useHandleTabLayout(index);
  const handlePressTabItem = useCallback(() => {
    const scene = {
      route
    };
    onTabPress === null || onTabPress === void 0 || onTabPress(scene);
    jumpTo(route.key);
  }, [jumpTo, onTabPress, route]);
  const handleLongPressTabItem = useCallback(() => {
    const scene = {
      route
    };
    onTabLongPress === null || onTabLongPress === void 0 || onTabLongPress(scene);
    jumpTo(route.key);
  }, [jumpTo, onTabLongPress, route]);

  // Use RNGH Tap gesture instead of Pressable for proper gesture coordination
  // This fixes Android sticky header touch issues where Pan gesture intercepts touches
  const tapGesture = useMemo(() => Gesture.Tap().onEnd(() => {
    runOnJS(handlePressTabItem)();
  }), [handlePressTabItem]);
  const longPressGesture = useMemo(() => Gesture.LongPress().minDuration(500).onEnd(() => {
    runOnJS(handleLongPressTabItem)();
  }), [handleLongPressTabItem]);
  const composedGesture = useMemo(() => Gesture.Exclusive(longPressGesture, tapGesture), [longPressGesture, tapGesture]);
  return /*#__PURE__*/React.createElement(GestureDetector, {
    gesture: composedGesture
  }, /*#__PURE__*/React.createElement(Animated.View, {
    onLayout: handleTabLayout,
    style: style
  }, children));
});
export default Tab;
//# sourceMappingURL=Tab.js.map