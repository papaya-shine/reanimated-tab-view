"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useStickyTabBarStyle = exports.useOuterScrollHandler = void 0;
var _reactNativeReanimated = require("react-native-reanimated");
var _Collapsible = require("../../providers/Collapsible");
var _collapsible = require("../../constants/collapsible");
/**
 * Hook that handles the outer scroll view's scroll events.
 *
 * The outer scroll manages:
 * 1. Header collapse (scrolling the header away)
 * 2. Sticky tab bar behavior
 * 3. Triggering refresh when at top and pulling down
 */
const useOuterScrollHandler = () => {
  const {
    outerScrollY,
    isHeaderCollapsed,
    headerHeight
  } = (0, _Collapsible.useCollapsibleContext)();
  const handleScroll = (0, _reactNativeReanimated.useAnimatedScrollHandler)({
    onScroll: event => {
      // Track scroll position
      outerScrollY.value = event.contentOffset.y;

      // Determine if header is fully collapsed
      const collapsed = event.contentOffset.y >= headerHeight;
      if (collapsed !== isHeaderCollapsed.value) {
        isHeaderCollapsed.value = collapsed;
      }
    },
    onBeginDrag: () => {
      // Could add haptic feedback here when starting to drag
    },
    onEndDrag: event => {
      // Optional: snap to fully collapsed or expanded if in between
      const scrollY = event.contentOffset.y;
      const halfHeader = headerHeight / 2;

      // Only snap if header is partially visible
      if (scrollY > 0 && scrollY < headerHeight) {
        if (scrollY < halfHeader) {
          // Snap to fully expanded (scroll to 0)
          outerScrollY.value = (0, _reactNativeReanimated.withTiming)(0, {
            duration: _collapsible.SCROLL_SNAP_DURATION,
            easing: _reactNativeReanimated.Easing.out(_reactNativeReanimated.Easing.ease)
          });
        } else {
          // Snap to fully collapsed (scroll to headerHeight)
          outerScrollY.value = (0, _reactNativeReanimated.withTiming)(headerHeight, {
            duration: _collapsible.SCROLL_SNAP_DURATION,
            easing: _reactNativeReanimated.Easing.out(_reactNativeReanimated.Easing.ease)
          });
        }
      }
    }
  });
  return handleScroll;
};

/**
 * Hook to get the animated style for the sticky tab bar.
 * The tab bar should stick at the top when the header is scrolled away.
 */
exports.useOuterScrollHandler = useOuterScrollHandler;
const useStickyTabBarStyle = () => {
  // Note: We use stickyHeaderIndices on the ScrollView instead of manual sticky
  // This is more performant and uses native sticky header behavior
  return null;
};
exports.useStickyTabBarStyle = useStickyTabBarStyle;
//# sourceMappingURL=useOuterScrollHandler.js.map