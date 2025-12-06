"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useHeaderContext = exports.HeaderContextProvider = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNativeReanimated = require("react-native-reanimated");
var _Internal = require("./Internal");
var _scrollable = require("../constants/scrollable");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const HeaderContext = /*#__PURE__*/(0, _react.createContext)({
  animatedTranslateYSV: {
    value: 0
  },
  gestureSourceSV: {
    value: _scrollable.GestureSource.SCROLL
  },
  translateYBounds: {
    lower: 0,
    upper: 0
  },
  refreshOverscrollSV: {
    value: 0
  },
  isRefreshTriggeredSV: {
    value: false
  }
});
const HeaderContextProvider = exports.HeaderContextProvider = /*#__PURE__*/_react.default.memo(function HeaderContextProvider({
  children
}) {
  const animatedTranslateYSV = (0, _reactNativeReanimated.useSharedValue)(0);
  const gestureSourceSV = (0, _reactNativeReanimated.useSharedValue)(_scrollable.GestureSource.SCROLL);

  // Pull-to-refresh overscroll tracking
  const refreshOverscrollSV = (0, _reactNativeReanimated.useSharedValue)(0);
  const isRefreshTriggeredSV = (0, _reactNativeReanimated.useSharedValue)(false);
  const {
    tabViewHeaderLayout
  } = (0, _Internal.useInternalContext)();
  const translateYBounds = (0, _react.useMemo)(() => {
    return {
      lower: 0,
      upper: tabViewHeaderLayout.height
    };
  }, [tabViewHeaderLayout.height]);
  const value = (0, _react.useMemo)(() => ({
    animatedTranslateYSV,
    translateYBounds,
    gestureSourceSV,
    refreshOverscrollSV,
    isRefreshTriggeredSV
  }), [animatedTranslateYSV, translateYBounds, gestureSourceSV, refreshOverscrollSV, isRefreshTriggeredSV]);
  return /*#__PURE__*/_react.default.createElement(HeaderContext.Provider, {
    value: value
  }, children);
});
const useHeaderContext = () => (0, _react.useContext)(HeaderContext);
exports.useHeaderContext = useHeaderContext;
//# sourceMappingURL=Header.js.map