"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RTVScrollViewWithoutScrollHandler = exports.RTVScrollView = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _reactNative = require("react-native");
var _Internal = require("../../providers/Internal");
var _Props = require("../../providers/Props");
var _useScrollHandlers = require("../../hooks/scrollable/useScrollHandlers");
var _useSyncScrollWithPanTranslation = require("../../hooks/scrollable/useSyncScrollWithPanTranslation");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
/**
 * RTVScrollViewWithoutScrollHandler
 * 
 * In COLLAPSIBLE mode (renderHeader provided):
 * - Scroll is always enabled (nested scroll handles coordination)
 * - No RefreshControl (handled by outer scroll)
 * 
 * In STATIC mode (no renderHeader):
 * - Normal scrolling behavior
 * - Can have its own RefreshControl (user-provided or from TabView props)
 */
const RTVScrollViewWithoutScrollHandler = exports.RTVScrollViewWithoutScrollHandler = /*#__PURE__*/_react.default.memo( /*#__PURE__*/(0, _react.forwardRef)((props, ref) => {
  const {
    children,
    refreshControl: userProvidedRefreshControl,
    contentContainerStyle,
    scrollEnabled: userScrollEnabled = true,
    ...rest
  } = props;
  const {
    tabViewCarouselLayout
  } = (0, _Internal.useInternalContext)();
  const {
    renderHeader,
    refreshing,
    onRefresh,
    refreshControlColor
  } = (0, _Props.usePropsContext)();
  const scrollRef = (0, _reactNativeReanimated.useAnimatedRef)();

  // Check if we're in collapsible mode (has renderHeader)
  const isCollapsibleMode = !!renderHeader;

  // Content container style - simplified for both modes
  const finalContentContainerStyle = (0, _react.useMemo)(() => {
    return [styles.contentContainer, {
      minHeight: tabViewCarouselLayout.height,
      flexGrow: 1
    }, contentContainerStyle];
  }, [tabViewCarouselLayout.height, contentContainerStyle]);
  (0, _react.useImperativeHandle)(ref, () => scrollRef.current);

  // Only sync with pan translation in legacy scenarios
  // In new collapsible mode, outer scroll handles everything
  if (!isCollapsibleMode) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    (0, _useSyncScrollWithPanTranslation.useSyncScrollWithPanTranslation)(scrollRef);
  }

  // Determine RefreshControl:
  // 1. In collapsible mode: NO RefreshControl (outer scroll has it)
  // 2. In static mode with user-provided refreshControl: use user's
  // 3. In static mode with TabView's onRefresh: create one
  // 4. Otherwise: no RefreshControl
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
  return /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.ScrollView, _extends({
    ref: scrollRef
  }, rest, {
    scrollEventThrottle: 16,
    nestedScrollEnabled: true,
    scrollEnabled: userScrollEnabled,
    contentContainerStyle: finalContentContainerStyle,
    refreshControl: finalRefreshControl
  }), children);
}));

/**
 * RTVScrollView - With scroll handlers
 */
const RTVScrollView = exports.RTVScrollView = /*#__PURE__*/_react.default.memo( /*#__PURE__*/(0, _react.forwardRef)((props, ref) => {
  const {
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
    ...rest
  } = props;
  const scrollRef = (0, _reactNativeReanimated.useAnimatedRef)();
  const handleScroll = (0, _useScrollHandlers.useScrollHandlers)({
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin
  });
  (0, _react.useImperativeHandle)(ref, () => scrollRef.current);
  return /*#__PURE__*/_react.default.createElement(RTVScrollViewWithoutScrollHandler, _extends({}, rest, {
    onScroll: handleScroll,
    ref: ref
  }));
}));
const styles = _reactNative.StyleSheet.create({
  contentContainer: {
    flexGrow: 1
  }
});
//# sourceMappingURL=RTVScrollView.js.map