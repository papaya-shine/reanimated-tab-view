"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RTVFlatList = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _RTVScrollView = require("./RTVScrollView");
var _useScrollHandlers = require("../../hooks/scrollable/useScrollHandlers");
var _Props = require("../../providers/Props");
var _Collapsible = require("../../providers/Collapsible");
var _Internal = require("../../providers/Internal");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
/**
 * RTVFlatList - FlatList component for use within TabView
 * 
 * In COLLAPSIBLE mode:
 * - scrollEnabled={false} - outer ScrollView handles all gestures
 * - Reports content height to context (keyed by route)
 * - Syncs scroll position from outer scroll via useAnimatedReaction
 * - Viewport height comes from parent container, NOT from FlatList's onLayout
 *   (because with scrollEnabled={false}, FlatList expands to fit content)
 * 
 * In STATIC mode:
 * - Normal scrolling behavior
 * - Can have its own RefreshControl
 */
function RTVFlatListInner(props, ref) {
  var _routes$currentRouteI;
  const {
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
    onContentSizeChange,
    onLayout,
    refreshControl: userProvidedRefreshControl,
    scrollEnabled: userScrollEnabled = true,
    routeKey: explicitRouteKey,
    ...restProps
  } = props;
  const {
    renderHeader,
    refreshing,
    onRefresh,
    refreshControlColor
  } = (0, _Props.usePropsContext)();
  const {
    currentRouteIndex,
    routes
  } = (0, _Internal.useInternalContext)();

  // Use animated ref for UI thread access
  const flatListAnimatedRef = (0, _reactNativeReanimated.useAnimatedRef)();

  // Regular ref for JS thread operations
  const flatListRef = (0, _react.useRef)(null);
  const maxContentHeightRef = (0, _react.useRef)(0);
  const handleScroll = (0, _useScrollHandlers.useScrollHandlers)({
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin
  });
  const renderScrollComponent = (0, _react.useCallback)(scrollViewProps => {
    return /*#__PURE__*/_react.default.createElement(_RTVScrollView.RTVScrollViewWithoutScrollHandler, scrollViewProps);
  }, []);

  // Expose ref to parent
  (0, _react.useImperativeHandle)(ref, () => flatListRef.current);

  // Check if we're in collapsible mode
  const isCollapsibleMode = !!renderHeader;

  // Get collapsible context
  const collapsibleContext = (0, _Collapsible.useCollapsibleContext)();

  // Determine the route key for this FlatList
  // Try explicit prop first, then try to infer from current route
  const routeKey = explicitRouteKey || ((_routes$currentRouteI = routes[currentRouteIndex]) === null || _routes$currentRouteI === void 0 ? void 0 : _routes$currentRouteI.key) || 'unknown';

  // Register this FlatList with the collapsible context
  (0, _react.useEffect)(() => {
    if (isCollapsibleMode && flatListRef.current) {
      collapsibleContext.registerInnerScroll(routeKey, flatListRef.current);
    }
  }, [isCollapsibleMode, collapsibleContext, routeKey]);

  // Handle content size change - report to context
  // Only report content HEIGHT, not viewport (viewport comes from parent)
  const handleContentSizeChange = (0, _react.useCallback)((w, h) => {
    // Track max height we've ever seen for this FlatList
    if (h > maxContentHeightRef.current) {
      maxContentHeightRef.current = h;
      if (isCollapsibleMode) {
        collapsibleContext.setInnerContentHeight(routeKey, h);
      }
    }
    onContentSizeChange === null || onContentSizeChange === void 0 || onContentSizeChange(w, h);
  }, [isCollapsibleMode, onContentSizeChange, collapsibleContext, routeKey]);

  // Handle layout - just pass through, don't report viewport
  // (viewport height is determined by parent container, not FlatList)
  const handleLayout = (0, _react.useCallback)(event => {
    onLayout === null || onLayout === void 0 || onLayout(event);
  }, [onLayout]);

  // Sync scroll position from outer scroll (collapsible mode only)
  // This runs on UI thread and syncs the inner FlatList scroll position
  (0, _reactNativeReanimated.useAnimatedReaction)(() => collapsibleContext.innerScrollY.value, innerY => {
    'worklet';

    if (isCollapsibleMode) {
      (0, _reactNativeReanimated.scrollTo)(flatListAnimatedRef, 0, innerY, false);
    }
  }, [isCollapsibleMode]);

  // Sync the regular ref to the animated ref
  const setRefs = (0, _react.useCallback)(instance => {
    flatListRef.current = instance;
    flatListAnimatedRef(instance);
  }, [flatListAnimatedRef]);

  // In collapsible mode, don't use custom scroll component
  const scrollComponentProps = isCollapsibleMode ? {} : {
    renderScrollComponent: renderScrollComponent
  };

  // Determine RefreshControl (only for static mode)
  let finalRefreshControl = undefined;
  if (!isCollapsibleMode) {
    if (userProvidedRefreshControl) {
      finalRefreshControl = userProvidedRefreshControl;
    } else if (onRefresh) {
      finalRefreshControl = /*#__PURE__*/_react.default.createElement(_reactNative.RefreshControl, {
        refreshing: refreshing ?? false,
        onRefresh: onRefresh,
        tintColor: refreshControlColor,
        colors: refreshControlColor ? [refreshControlColor] : undefined
      });
    }
  }

  // In collapsible mode: scrollEnabled={false}, outer scroll handles everything
  const effectiveScrollEnabled = isCollapsibleMode ? false : userScrollEnabled;
  return /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.FlatList, _extends({
    ref: setRefs
  }, restProps, scrollComponentProps, {
    onScroll: isCollapsibleMode ? undefined : handleScroll,
    onContentSizeChange: handleContentSizeChange,
    onLayout: handleLayout,
    nestedScrollEnabled: true,
    scrollEnabled: effectiveScrollEnabled,
    refreshControl: finalRefreshControl
    // Disable bounce when scroll is disabled
    ,
    bounces: effectiveScrollEnabled
    // Show scrollbar only when scrollable
    ,
    showsVerticalScrollIndicator: effectiveScrollEnabled
  }));
}
const RTVFlatList = exports.RTVFlatList = /*#__PURE__*/_react.default.memo( /*#__PURE__*/(0, _react.forwardRef)(RTVFlatListInner));
//# sourceMappingURL=RTVFlatList.js.map