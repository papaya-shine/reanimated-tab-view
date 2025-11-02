"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _TabLayout = require("../providers/TabLayout");
var _Internal = require("../providers/Internal");
var _Props = require("../providers/Props");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const TabIndicator = /*#__PURE__*/_react.default.memo(props => {
  const {
    style
  } = props;
  const {
    tabBarType,
    tabBarPosition,
    tabBarIndicatorStyle
  } = (0, _Props.usePropsContext)();
  const {
    animatedRouteIndex
  } = (0, _Internal.useInternalContext)();
  const {
    routeIndexToTabWidthMapSV,
    routeIndexToTabContentWidthMapSV
  } = (0, _TabLayout.useTabLayoutContext)();
  const animatedTabIndicatorContainerStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    const fromIndex = Math.floor(animatedRouteIndex.value);
    const toIndex = Math.ceil(animatedRouteIndex.value);
    const progress = animatedRouteIndex.value - fromIndex;

    // Calculate translateX for fromIndex (sum of widths up to fromIndex)
    let fromTranslateX = 0;
    for (let i = 0; i < fromIndex; i++) {
      fromTranslateX += routeIndexToTabWidthMapSV.value[i] ?? 0;
    }

    // Calculate translateX for toIndex (sum of widths up to toIndex)
    let toTranslateX = 0;
    for (let i = 0; i < toIndex; i++) {
      toTranslateX += routeIndexToTabWidthMapSV.value[i] ?? 0;
    }

    // Get widths for interpolation
    const fromTabWidth = routeIndexToTabWidthMapSV.value[fromIndex] ?? 0;
    const toTabWidth = routeIndexToTabWidthMapSV.value[toIndex] ?? 0;
    const fromContentWidth = routeIndexToTabContentWidthMapSV.value[fromIndex] ?? 0;
    const toContentWidth = routeIndexToTabContentWidthMapSV.value[toIndex] ?? 0;

    // For primary tabs, center the indicator on the tab content
    let finalTranslateX = fromTranslateX + (toTranslateX - fromTranslateX) * progress;
    let width = fromTabWidth + (toTabWidth - fromTabWidth) * progress;
    if (tabBarType === 'primary') {
      // Add centering offset: (tabWidth - contentWidth) / 2
      const fromCenterOffset = (fromTabWidth - fromContentWidth) / 2;
      const toCenterOffset = (toTabWidth - toContentWidth) / 2;
      const centerOffset = fromCenterOffset + (toCenterOffset - fromCenterOffset) * progress;
      finalTranslateX += centerOffset;
      width = fromContentWidth + (toContentWidth - fromContentWidth) * progress;
    }
    return {
      transform: [{
        translateX: finalTranslateX
      }],
      width
    };
  }, [tabBarType]);
  return /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, {
    style: [styles.tabIndicatorContainer, animatedTabIndicatorContainerStyle]
  }, /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, {
    style: [styles.tabIndicator, tabBarType === 'primary' && styles.primaryTabIndicator, tabBarPosition === 'top' && styles.topTabIndicator, tabBarPosition === 'bottom' && styles.bottomTabIndicator, tabBarIndicatorStyle, style]
  }));
});
var _default = exports.default = TabIndicator;
const styles = _reactNative.StyleSheet.create({
  tabIndicatorContainer: {
    position: 'absolute',
    left: 0,
    height: '100%',
    justifyContent: 'center'
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '100%',
    backgroundColor: 'yellow'
  },
  topTabIndicator: {
    bottom: 0
  },
  bottomTabIndicator: {
    top: 0
  },
  primaryTabIndicator: {
    borderTopRightRadius: 2,
    borderTopLeftRadius: 2
  }
});
//# sourceMappingURL=TabIndicator.js.map