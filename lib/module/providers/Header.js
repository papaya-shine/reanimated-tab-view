import React, { createContext, useContext, useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useInternalContext } from './Internal';
import { GestureSource } from '../constants/scrollable';
const HeaderContext = /*#__PURE__*/createContext({
  animatedTranslateYSV: {
    value: 0
  },
  gestureSourceSV: {
    value: GestureSource.SCROLL
  },
  translateYBounds: {
    lower: 0,
    upper: 0
  },
  refreshOverscrollSV: {
    value: 0
  },
  isRefreshTriggeredSV: {
    value: false
  }
});
export const HeaderContextProvider = /*#__PURE__*/React.memo(function HeaderContextProvider({
  children
}) {
  const animatedTranslateYSV = useSharedValue(0);
  const gestureSourceSV = useSharedValue(GestureSource.SCROLL);

  // Pull-to-refresh overscroll tracking
  const refreshOverscrollSV = useSharedValue(0);
  const isRefreshTriggeredSV = useSharedValue(false);
  const {
    tabViewHeaderLayout
  } = useInternalContext();
  const translateYBounds = useMemo(() => {
    return {
      lower: 0,
      upper: tabViewHeaderLayout.height
    };
  }, [tabViewHeaderLayout.height]);
  const value = useMemo(() => ({
    animatedTranslateYSV,
    translateYBounds,
    gestureSourceSV,
    refreshOverscrollSV,
    isRefreshTriggeredSV
  }), [animatedTranslateYSV, translateYBounds, gestureSourceSV, refreshOverscrollSV, isRefreshTriggeredSV]);
  return /*#__PURE__*/React.createElement(HeaderContext.Provider, {
    value: value
  }, children);
});
export const useHeaderContext = () => useContext(HeaderContext);
//# sourceMappingURL=Header.js.map