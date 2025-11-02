import React from 'react';
import { type SharedValue } from 'react-native-reanimated';
import { GestureSource } from '../constants/scrollable';
type HeaderContext = {
    animatedTranslateYSV: SharedValue<number>;
    gestureSourceSV: SharedValue<GestureSource>;
    translateYBounds: {
        lower: number;
        upper: number;
    };
};
declare const HeaderContext: React.Context<HeaderContext>;
type HeaderContextProviderProps = {
    children: React.ReactNode;
};
export declare const HeaderContextProvider: React.NamedExoticComponent<HeaderContextProviderProps>;
export declare const useHeaderContext: () => HeaderContext;
export {};
//# sourceMappingURL=Header.d.ts.map