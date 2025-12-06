import React, { createContext, useContext, useMemo } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useInternalContext } from './Internal';
import { GestureSource } from '../constants/scrollable';

type HeaderContext = {
  animatedTranslateYSV: SharedValue<number>;
  gestureSourceSV: SharedValue<GestureSource>;
  translateYBounds: { lower: number; upper: number };
  // Pull-to-refresh overscroll tracking
  refreshOverscrollSV: SharedValue<number>;
  isRefreshTriggeredSV: SharedValue<boolean>;
};

const HeaderContext = createContext<HeaderContext>({
  animatedTranslateYSV: { value: 0 } as SharedValue<number>,
  gestureSourceSV: { value: GestureSource.SCROLL } as SharedValue<GestureSource>,
  translateYBounds: { lower: 0, upper: 0 },
  refreshOverscrollSV: { value: 0 } as SharedValue<number>,
  isRefreshTriggeredSV: { value: false } as SharedValue<boolean>,
});

type HeaderContextProviderProps = {
  children: React.ReactNode;
};

export const HeaderContextProvider = React.memo<HeaderContextProviderProps>(
  function HeaderContextProvider({ children }) {
    const animatedTranslateYSV = useSharedValue(0);

    const gestureSourceSV = useSharedValue<GestureSource>(GestureSource.SCROLL);

    // Pull-to-refresh overscroll tracking
    const refreshOverscrollSV = useSharedValue(0);
    const isRefreshTriggeredSV = useSharedValue(false);

    const { tabViewHeaderLayout } = useInternalContext();

    const translateYBounds = useMemo(() => {
      return {
        lower: 0,
        upper: tabViewHeaderLayout.height,
      };
    }, [tabViewHeaderLayout.height]);

    const value = useMemo(
      () => ({
        animatedTranslateYSV,
        translateYBounds,
        gestureSourceSV,
        refreshOverscrollSV,
        isRefreshTriggeredSV,
      }),
      [animatedTranslateYSV, translateYBounds, gestureSourceSV, refreshOverscrollSV, isRefreshTriggeredSV]
    );

    return (
      <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
    );
  }
);

export const useHeaderContext = () => useContext(HeaderContext);
