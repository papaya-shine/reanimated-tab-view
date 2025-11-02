import React from 'react';
import { type SharedValue } from 'react-native-reanimated';
import type { Route } from '../types';
type SceneRendererContext = {
    route: Route;
    isRouteFocused: boolean;
    scrollYSV: SharedValue<number>;
};
declare const SceneRendererContext: React.Context<SceneRendererContext>;
type SceneRendererContextProviderProps = {
    route: Route;
    index: number;
    children: React.ReactNode;
};
export declare const SceneRendererContextProvider: React.NamedExoticComponent<SceneRendererContextProviderProps>;
export declare const useSceneRendererContext: () => SceneRendererContext;
export {};
//# sourceMappingURL=SceneRenderer.d.ts.map