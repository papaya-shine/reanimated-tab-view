import React, { createContext, useContext, useMemo, useRef, useCallback, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

/**
 * Collapsible scroll coordination context
 * 
 * This enables the "master scroll" pattern where:
 * - Outer ScrollView handles all gestures (including RefreshControl)
 * - Inner FlatList is non-scrollable, synced programmatically
 * - Single continuous gesture collapses header then scrolls content
 */

const CollapsibleContext = /*#__PURE__*/createContext({
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
  outerScrollY: {
    value: 0
  },
  innerScrollY: {
    value: 0
  },
  isHeaderCollapsed: {
    value: false
  },
  refreshing: false,
  onRefresh: undefined
});
export const CollapsibleContextProvider = /*#__PURE__*/React.memo(function CollapsibleContextProvider({
  children,
  headerHeight,
  onRefresh,
  refreshing = false
}) {
  // Content area height (viewport for inner scroll) - set by CollapsibleScrollContainer
  const [contentAreaHeight, setContentAreaHeightState] = useState(0);

  // Inner scroll refs - keyed by route
  const innerScrollRefsMap = useRef(new Map());

  // Inner content heights - keyed by route
  const [innerContentHeightsMap, setInnerContentHeightsMap] = useState(new Map());

  // Active route key
  const [activeRouteKey, setActiveRouteKeyState] = useState('');

  // Shared values for scroll positions
  const outerScrollY = useSharedValue(0);
  const innerScrollY = useSharedValue(0);
  const isHeaderCollapsed = useSharedValue(false);

  // Set content area height
  const setContentAreaHeight = useCallback(height => {
    setContentAreaHeightState(height);
  }, []);

  // Register inner scroll ref for a route
  const registerInnerScroll = useCallback((routeKey, ref) => {
    innerScrollRefsMap.current.set(routeKey, ref);
  }, []);

  // Get inner scroll ref for a route
  const getInnerScrollRef = useCallback(routeKey => {
    return innerScrollRefsMap.current.get(routeKey);
  }, []);

  // Set inner content height for a route
  const setInnerContentHeight = useCallback((routeKey, contentHeight) => {
    setInnerContentHeightsMap(prev => {
      const newMap = new Map(prev);
      newMap.set(routeKey, contentHeight);
      return newMap;
    });
  }, []);

  // Get inner content height for a route
  const getInnerContentHeight = useCallback(routeKey => {
    return innerContentHeightsMap.get(routeKey) || 0;
  }, [innerContentHeightsMap]);

  // Set active route key
  const setActiveRouteKey = useCallback(key => {
    setActiveRouteKeyState(key);
  }, []);

  // Calculate max content height across all tabs
  const maxInnerContentHeight = useMemo(() => {
    let max = 0;
    innerContentHeightsMap.forEach(height => {
      if (height > max) max = height;
    });
    return max;
  }, [innerContentHeightsMap]);
  const value = useMemo(() => ({
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
    onRefresh
  }), [headerHeight, contentAreaHeight, setContentAreaHeight, registerInnerScroll, getInnerScrollRef, setInnerContentHeight, getInnerContentHeight, activeRouteKey, setActiveRouteKey, maxInnerContentHeight, outerScrollY, innerScrollY, isHeaderCollapsed, refreshing, onRefresh]);
  return /*#__PURE__*/React.createElement(CollapsibleContext.Provider, {
    value: value
  }, children);
});
export const useCollapsibleContext = () => useContext(CollapsibleContext);
//# sourceMappingURL=Collapsible.js.map