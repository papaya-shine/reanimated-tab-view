"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RefreshIndicator = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _Header = require("../../providers/Header");
var _Props = require("../../providers/Props");
var _refresh = require("../../constants/refresh");
var _useRefreshHelpers = require("../../hooks/scrollable/useRefreshHelpers");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * RefreshIndicator component that floats on top of content and moves with it
 */
const RefreshIndicator = exports.RefreshIndicator = /*#__PURE__*/_react.default.memo(() => {
  const {
    refreshOverscrollSV
  } = (0, _Header.useHeaderContext)();
  const {
    refreshing,
    refreshControlColor,
    onRefresh
  } = (0, _Props.usePropsContext)();

  // Track previous refreshing state to detect when refresh completes
  const wasRefreshingRef = (0, _react.useRef)(refreshing);

  // When refreshing changes from true to false, animate spinner back to 0
  (0, _react.useEffect)(() => {
    if (wasRefreshingRef.current && !refreshing) {
      // Refresh just completed, animate back to 0
      (0, _useRefreshHelpers.animateRefreshOverscrollToZero)(refreshOverscrollSV);
    }
    wasRefreshingRef.current = refreshing;
  }, [refreshing, refreshOverscrollSV]);
  const animatedContainerStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    // Height grows with pull, capped at 60. This pushes content down naturally.
    const height = refreshing ? 60 : Math.min(refreshOverscrollSV.value, 60);
    const opacity = (0, _reactNativeReanimated.interpolate)(refreshOverscrollSV.value, [0, _refresh.REFRESH_TRIGGER_THRESHOLD * _refresh.REFRESH_OPACITY_START_FACTOR, _refresh.REFRESH_TRIGGER_THRESHOLD], [0, _refresh.REFRESH_OPACITY_MID, 1], _reactNativeReanimated.Extrapolation.CLAMP);
    return {
      height,
      opacity: refreshing ? 1 : opacity
    };
  });
  const animatedSpinnerStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    const scale = (0, _reactNativeReanimated.interpolate)(refreshOverscrollSV.value, [0, _refresh.REFRESH_TRIGGER_THRESHOLD], [0.3, 1], _reactNativeReanimated.Extrapolation.CLAMP);
    return {
      transform: [{
        scale: refreshing ? 1 : scale
      }]
    };
  });

  // Don't render if no onRefresh handler
  if (!onRefresh) {
    return null;
  }
  return /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, {
    style: [styles.refreshIndicatorContainer, animatedContainerStyle]
  }, /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, {
    style: animatedSpinnerStyle
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ActivityIndicator, {
    size: "large",
    color: refreshControlColor || _refresh.REFRESH_DEFAULT_COLOR,
    animating: true
  })));
});
const styles = _reactNative.StyleSheet.create({
  refreshIndicatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  }
});
//# sourceMappingURL=RefreshIndicator.js.map