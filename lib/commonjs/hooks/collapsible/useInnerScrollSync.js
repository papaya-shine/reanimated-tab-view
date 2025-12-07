"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useIsInnerScrollEnabled = exports.useInnerScrollSync = void 0;
var _reactNativeReanimated = require("react-native-reanimated");
var _Collapsible = require("../../providers/Collapsible");
var _SceneRenderer = require("../../providers/SceneRenderer");
var _collapsible = require("../../constants/collapsible");
/**
 * Hook that synchronizes inner scroll (content) with outer scroll (header).
 *
 * Behavior:
 * 1. When outer scroll hasn't reached header height, inner scroll is locked at 0
 * 2. When outer scroll >= header height (header collapsed), inner scroll is free
 * 3. When inner scroll hits top (0) and user pulls down, transfer to outer scroll
 *
 * For tab switching:
 * - All tabs sync their scroll position relative to header collapse state
 * - When switching tabs, the new tab adjusts to match the header state
 */
const useInnerScrollSync = scrollRef => {
  const {
    outerScrollY,
    isHeaderCollapsed,
    headerHeight
  } = (0, _Collapsible.useCollapsibleContext)();
  const {
    isRouteFocused,
    scrollYSV
  } = (0, _SceneRenderer.useSceneRendererContext)();

  // Track if user is dragging inner scroll at top
  const isDraggingAtTop = (0, _reactNativeReanimated.useSharedValue)(false);
  const lastDragY = (0, _reactNativeReanimated.useSharedValue)(0);

  // Sync inner scroll position when header collapse state changes (for non-focused tabs)
  (0, _reactNativeReanimated.useAnimatedReaction)(() => outerScrollY.value, currentOuterY => {
    // Only sync non-focused tabs
    if (!isRouteFocused) {
      // If header is collapsing/expanding, sync all tabs
      if (currentOuterY <= headerHeight) {
        // Header visible - ensure inner scroll is at 0
        (0, _reactNativeReanimated.scrollTo)(scrollRef, 0, 0, false);
        scrollYSV.value = 0;
      }
    }
  }, [isRouteFocused, headerHeight]);
  const handleScroll = (0, _reactNativeReanimated.useAnimatedScrollHandler)({
    onScroll: event => {
      scrollYSV.value = event.contentOffset.y;

      // If not focused, don't process further
      if (!isRouteFocused) {
        return;
      }

      // Track dragging state at top for transfer logic
      if (event.contentOffset.y <= _collapsible.SCROLL_TRANSFER_THRESHOLD) {
        isDraggingAtTop.value = true;
      } else {
        isDraggingAtTop.value = false;
      }
    },
    onBeginDrag: event => {
      lastDragY.value = event.contentOffset.y;
    },
    onEndDrag: event => {
      // Check if user was at top and pulled down (wants to expand header)
      if (isRouteFocused && lastDragY.value <= _collapsible.SCROLL_TRANSFER_THRESHOLD && event.contentOffset.y < 0 &&
      // Overscroll (iOS)
      isHeaderCollapsed.value) {
        // Transfer scroll intent to outer scroll to expand header
        // The RefreshControl will handle the actual refresh on iOS
      }
    }
  });
  return {
    handleScroll,
    scrollRef
  };
};

/**
 * Hook to check if inner scroll should be enabled.
 * Inner scroll is only enabled when header is fully collapsed.
 */
exports.useInnerScrollSync = useInnerScrollSync;
const useIsInnerScrollEnabled = () => {
  const {
    isHeaderCollapsed
  } = (0, _Collapsible.useCollapsibleContext)();

  // Note: We don't actually disable scrolling - instead we let native
  // nested scroll handling work. This hook is for reference/debugging.
  return isHeaderCollapsed;
};
exports.useIsInnerScrollEnabled = useIsInnerScrollEnabled;
//# sourceMappingURL=useInnerScrollSync.js.map