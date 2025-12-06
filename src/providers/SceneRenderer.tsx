import React, { createContext, useContext, useMemo } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useInternalContext } from '../providers/Internal';
import type { Route } from '../types';

type SceneRendererContext = {
  route: Route;
  isRouteFocused: boolean;
  scrollYSV: SharedValue<number>;
};

const SceneRendererContext = createContext<SceneRendererContext>({
  route: { key: '', title: '' },
  isRouteFocused: false,
  scrollYSV: { value: 0 } as SharedValue<number>,
});

type SceneRendererContextProviderProps = {
  route: Route;
  index: number;
  children: React.ReactNode;
};

export const SceneRendererContextProvider =
  React.memo<SceneRendererContextProviderProps>(
    function SceneRendererContextProvider({ route, index, children }) {
      const { currentRouteIndex } = useInternalContext();

      const isRouteFocused = useMemo(() => {
        return index === currentRouteIndex;
      }, [index, currentRouteIndex]);

      const scrollYSV = useSharedValue(0);

      const value = useMemo(
        () => ({
          route,
          isRouteFocused,
          scrollYSV,
        }),
        [route, isRouteFocused, scrollYSV]
      );

      return (
        <SceneRendererContext.Provider value={value}>
          {children}
        </SceneRendererContext.Provider>
      );
    }
  );

export const useSceneRendererContext = () => useContext(SceneRendererContext);
