import { useAnimatedStyle } from 'react-native-reanimated';
import { useHeaderContext } from '../../providers/Header';
export const useGestureContentTranslateYStyle = () => {
  const {
    animatedTranslateYSV
  } = useHeaderContext();
  return useAnimatedStyle(() => {
    return {
      transform: [{
        translateY: -animatedTranslateYSV.value
      }]
    };
  });
};
//# sourceMappingURL=useGestureContentTranslateYStyle.js.map