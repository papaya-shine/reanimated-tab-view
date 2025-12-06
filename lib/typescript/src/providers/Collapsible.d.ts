import React from 'react';
import { type SharedValue } from 'react-native-reanimated';
/**
 * Collapsible scroll coordination context
 *
 * This enables the "master scroll" pattern where:
 * - Outer ScrollView handles all gestures (including RefreshControl)
 * - Inner FlatList is non-scrollable, synced programmatically
 * - Single continuous gesture collapses header then scrolls content
 */
export type CollapsibleContextType = {
    headerHeight: number;
    contentAreaHeight: number;
    setContentAreaHeight: (height: number) => void;
    registerInnerScroll: (routeKey: string, ref: any) => void;
    getInnerScrollRef: (routeKey: string) => any;
    setInnerContentHeight: (routeKey: string, contentHeight: number) => void;
    getInnerContentHeight: (routeKey: string) => number;
    activeRouteKey: string;
    setActiveRouteKey: (key: string) => void;
    maxInnerContentHeight: number;
    outerScrollY: SharedValue<number>;
    innerScrollY: SharedValue<number>;
    isHeaderCollapsed: SharedValue<boolean>;
    refreshing: boolean;
    onRefresh?: () => void;
};
type CollapsibleContextProviderProps = {
    children: React.ReactNode;
    headerHeight: number;
    onRefresh?: () => void;
    refreshing?: boolean;
};
export declare const CollapsibleContextProvider: React.NamedExoticComponent<CollapsibleContextProviderProps>;
export declare const useCollapsibleContext: () => CollapsibleContextType;
export {};
//# sourceMappingURL=Collapsible.d.ts.map