import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useCallback,
  useState,
} from 'react';
import {
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Collapsible scroll coordination context
 * 
 * This enables the "master scroll" pattern where:
 * - Outer ScrollView handles all gestures (including RefreshControl)
 * - Inner FlatList is non-scrollable, synced programmatically
 * - Single continuous gesture collapses header then scrolls content
 */

export type CollapsibleContextType = {
  // Header
  headerHeight: number;
  
  // Viewport height (set by CollapsibleScrollContainer, not FlatList)
  contentAreaHeight: number;
  setContentAreaHeight: (height: number) => void;
  
  // Inner scroll registration - keyed by route
  registerInnerScroll: (routeKey: string, ref: any) => void;
  getInnerScrollRef: (routeKey: string) => any;
  
  // Inner content size - keyed by route (each tab has its own content height)
  setInnerContentHeight: (routeKey: string, contentHeight: number) => void;
  getInnerContentHeight: (routeKey: string) => number;
  
  // Active route (to know which tab's content height to use)
  activeRouteKey: string;
  setActiveRouteKey: (key: string) => void;
  
  // Max content height across all tabs (for scroll calculations)
  maxInnerContentHeight: number;
  
  // Scroll sync shared values
  outerScrollY: SharedValue<number>;
  innerScrollY: SharedValue<number>;
  isHeaderCollapsed: SharedValue<boolean>;
  
  // Refresh
  refreshing: boolean;
  onRefresh?: () => void;
};

const CollapsibleContext = createContext<CollapsibleContextType>({
  headerHeight: 0,
  contentAreaHeight: 0,
  setContentAreaHeight: () => {},
  registerInnerScroll: () => {},
  getInnerScrollRef: () => null,
  setInnerContentHeight: () => {},
  getInnerContentHeight: () => 0,
  activeRouteKey: '',
  setActiveRouteKey: () => {},
  maxInnerContentHeight: 0,
  outerScrollY: { value: 0 } as SharedValue<number>,
  innerScrollY: { value: 0 } as SharedValue<number>,
  isHeaderCollapsed: { value: false } as SharedValue<boolean>,
  refreshing: false,
  onRefresh: undefined,
});

type CollapsibleContextProviderProps = {
  children: React.ReactNode;
  headerHeight: number;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export const CollapsibleContextProvider = React.memo<CollapsibleContextProviderProps>(
  function CollapsibleContextProvider({
    children,
    headerHeight,
    onRefresh,
    refreshing = false,
  }) {
    // Content area height (viewport for inner scroll) - set by CollapsibleScrollContainer
    const [contentAreaHeight, setContentAreaHeightState] = useState(0);
    
    // Inner scroll refs - keyed by route
    const innerScrollRefsMap = useRef<Map<string, any>>(new Map());
    
    // Inner content heights - keyed by route
    const [innerContentHeightsMap, setInnerContentHeightsMap] = useState<Map<string, number>>(new Map());
    
    // Active route key
    const [activeRouteKey, setActiveRouteKeyState] = useState('');
    
    // Shared values for scroll positions
    const outerScrollY = useSharedValue(0);
    const innerScrollY = useSharedValue(0);
    const isHeaderCollapsed = useSharedValue(false);
    
    // Set content area height
    const setContentAreaHeight = useCallback((height: number) => {
      setContentAreaHeightState(height);
    }, []);
    
    // Register inner scroll ref for a route
    const registerInnerScroll = useCallback((routeKey: string, ref: any) => {
      innerScrollRefsMap.current.set(routeKey, ref);
    }, []);
    
    // Get inner scroll ref for a route
    const getInnerScrollRef = useCallback((routeKey: string) => {
      return innerScrollRefsMap.current.get(routeKey);
    }, []);
    
    // Set inner content height for a route
    const setInnerContentHeight = useCallback((routeKey: string, contentHeight: number) => {
      setInnerContentHeightsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(routeKey, contentHeight);
        return newMap;
      });
    }, []);
    
    // Get inner content height for a route
    const getInnerContentHeight = useCallback((routeKey: string) => {
      return innerContentHeightsMap.get(routeKey) || 0;
    }, [innerContentHeightsMap]);
    
    // Set active route key
    const setActiveRouteKey = useCallback((key: string) => {
      setActiveRouteKeyState(key);
    }, []);
    
    // Calculate max content height across all tabs
    const maxInnerContentHeight = useMemo(() => {
      let max = 0;
      innerContentHeightsMap.forEach((height) => {
        if (height > max) max = height;
      });
      return max;
    }, [innerContentHeightsMap]);

    const value = useMemo<CollapsibleContextType>(
      () => ({
        headerHeight,
        contentAreaHeight,
        setContentAreaHeight,
        registerInnerScroll,
        getInnerScrollRef,
        setInnerContentHeight,
        getInnerContentHeight,
        activeRouteKey,
        setActiveRouteKey,
        maxInnerContentHeight,
        outerScrollY,
        innerScrollY,
        isHeaderCollapsed,
        refreshing,
        onRefresh,
      }),
      [
        headerHeight,
        contentAreaHeight,
        setContentAreaHeight,
        registerInnerScroll,
        getInnerScrollRef,
        setInnerContentHeight,
        getInnerContentHeight,
        activeRouteKey,
        setActiveRouteKey,
        maxInnerContentHeight,
        outerScrollY,
        innerScrollY,
        isHeaderCollapsed,
        refreshing,
        onRefresh,
      ]
    );

    return (
      <CollapsibleContext.Provider value={value}>
        {children}
      </CollapsibleContext.Provider>
    );
  }
);

export const useCollapsibleContext = () => useContext(CollapsibleContext);
