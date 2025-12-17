import React, { useCallback, useMemo } from 'react';
import { type ViewStyle, type StyleProp } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { useHandleTabLayout } from '../hooks/useTabLayout';
import type { Route, Scene } from '../types';
import { useInternalContext } from '../providers/Internal';

type TabProps = React.PropsWithChildren<{
  index: number;
  route: Route;
  style?: StyleProp<ViewStyle>;
  onTabPress?: (scene: Scene) => void;
  onTabLongPress?: (scene: Scene) => void;
}>;
const Tab: React.FC<TabProps> = React.memo(
  ({ index, route, style, children, onTabPress, onTabLongPress }) => {
    const { jumpTo } = useInternalContext();

    const { handleTabLayout } = useHandleTabLayout(index);

    const handlePressTabItem = useCallback(() => {
      const scene = { route };
      onTabPress?.(scene);
      jumpTo(route.key);
    }, [jumpTo, onTabPress, route]);
    const handleLongPressTabItem = useCallback(() => {
      const scene = { route };
      onTabLongPress?.(scene);
      jumpTo(route.key);
    }, [jumpTo, onTabLongPress, route]);

    // Use RNGH Tap gesture instead of Pressable for proper gesture coordination
    // This fixes Android sticky header touch issues where Pan gesture intercepts touches
    const tapGesture = useMemo(
      () =>
        Gesture.Tap()
          .onEnd(() => {
            runOnJS(handlePressTabItem)();
          }),
      [handlePressTabItem]
    );

    const longPressGesture = useMemo(
      () =>
        Gesture.LongPress()
          .minDuration(500)
          .onEnd(() => {
            runOnJS(handleLongPressTabItem)();
          }),
      [handleLongPressTabItem]
    );

    const composedGesture = useMemo(
      () => Gesture.Exclusive(longPressGesture, tapGesture),
      [longPressGesture, tapGesture]
    );

    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View onLayout={handleTabLayout} style={style}>
          {children}
        </Animated.View>
      </GestureDetector>
    );
  }
);

export default Tab;
