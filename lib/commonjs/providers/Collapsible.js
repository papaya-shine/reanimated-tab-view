"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCollapsibleContext = exports.CollapsibleContextProvider = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNativeReanimated = require("react-native-reanimated");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Collapsible scroll coordination context
 *
 * This enables the "master scroll" pattern where:
 * - Outer ScrollView handles all gestures (including RefreshControl)
 * - Inner FlatList is non-scrollable, synced programmatically
 * - Single continuous gesture collapses header then scrolls content
 */

const CollapsibleContext = /*#__PURE__*/(0, _react.createContext)({
  headerHeight: 0,
  contentAreaHeight: 0,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setContentAreaHeight: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerInnerScroll: () => {},
  getInnerScrollRef: () => null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setInnerContentHeight: () => {},
  getInnerContentHeight: () => 0,
  activeRouteKey: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
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
const CollapsibleContextProvider = exports.CollapsibleContextProvider = /*#__PURE__*/_react.default.memo(function CollapsibleContextProvider({
  children,
  headerHeight,
  onRefresh,
  refreshing = false
}) {
  // Content area height (viewport for inner scroll) - set by CollapsibleScrollContainer
  const [contentAreaHeight, setContentAreaHeightState] = (0, _react.useState)(0);

  // Inner scroll refs - keyed by route
  const innerScrollRefsMap = (0, _react.useRef)(new Map());

  // Inner content heights - keyed by route
  const [innerContentHeightsMap, setInnerContentHeightsMap] = (0, _react.useState)(new Map());

  // Active route key
  const [activeRouteKey, setActiveRouteKeyState] = (0, _react.useState)('');

  // Shared values for scroll positions
  const outerScrollY = (0, _reactNativeReanimated.useSharedValue)(0);
  const innerScrollY = (0, _reactNativeReanimated.useSharedValue)(0);
  const isHeaderCollapsed = (0, _reactNativeReanimated.useSharedValue)(false);

  // Set content area height
  const setContentAreaHeight = (0, _react.useCallback)(height => {
    setContentAreaHeightState(height);
  }, []);

  // Register inner scroll ref for a route
  const registerInnerScroll = (0, _react.useCallback)((routeKey, ref) => {
    innerScrollRefsMap.current.set(routeKey, ref);
  }, []);

  // Get inner scroll ref for a route
  const getInnerScrollRef = (0, _react.useCallback)(routeKey => {
    return innerScrollRefsMap.current.get(routeKey);
  }, []);

  // Set inner content height for a route
  const setInnerContentHeight = (0, _react.useCallback)((routeKey, contentHeight) => {
    setInnerContentHeightsMap(prev => {
      const newMap = new Map(prev);
      newMap.set(routeKey, contentHeight);
      return newMap;
    });
  }, []);

  // Get inner content height for a route
  const getInnerContentHeight = (0, _react.useCallback)(routeKey => {
    return innerContentHeightsMap.get(routeKey) || 0;
  }, [innerContentHeightsMap]);

  // Set active route key
  const setActiveRouteKey = (0, _react.useCallback)(key => {
    setActiveRouteKeyState(key);
  }, []);

  // Calculate max content height across all tabs
  const maxInnerContentHeight = (0, _react.useMemo)(() => {
    let max = 0;
    innerContentHeightsMap.forEach(height => {
      if (height > max) {
        max = height;
      }
    });
    return max;
  }, [innerContentHeightsMap]);
  const value = (0, _react.useMemo)(() => ({
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
  return /*#__PURE__*/_react.default.createElement(CollapsibleContext.Provider, {
    value: value
  }, children);
});
const useCollapsibleContext = () => (0, _react.useContext)(CollapsibleContext);
exports.useCollapsibleContext = useCollapsibleContext;
//# sourceMappingURL=Collapsible.js.map