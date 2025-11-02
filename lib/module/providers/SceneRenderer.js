import React, { createContext, useContext, useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useInternalContext } from '../providers/Internal';
const SceneRendererContext = /*#__PURE__*/createContext({
  route: {
    key: '',
    title: ''
  },
  isRouteFocused: false,
  scrollYSV: {
    value: 0
  }
});
export const SceneRendererContextProvider = /*#__PURE__*/React.memo(function SceneRendererContextProvider({
  route,
  index,
  children
}) {
  const {
    currentRouteIndex
  } = useInternalContext();
  const isRouteFocused = useMemo(() => {
    return index === currentRouteIndex;
  }, [index, currentRouteIndex]);
  const scrollYSV = useSharedValue(0);
  const value = useMemo(() => ({
    route,
    isRouteFocused,
    scrollYSV
  }), [route, isRouteFocused, scrollYSV]);
  return /*#__PURE__*/React.createElement(SceneRendererContext.Provider, {
    value: value
  }, children);
});
export const useSceneRendererContext = () => useContext(SceneRendererContext);
//# sourceMappingURL=SceneRenderer.js.map