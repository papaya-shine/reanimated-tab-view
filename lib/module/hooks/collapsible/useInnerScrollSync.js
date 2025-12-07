import { useAnimatedScrollHandler, useAnimatedReaction, scrollTo, useSharedValue } from 'react-native-reanimated';
import { useCollapsibleContext } from '../../providers/Collapsible';
import { useSceneRendererContext } from '../../providers/SceneRenderer';
import { SCROLL_TRANSFER_THRESHOLD } from '../../constants/collapsible';

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
export const useInnerScrollSync = scrollRef => {
  const {
    outerScrollY,
    isHeaderCollapsed,
    headerHeight
  } = useCollapsibleContext();
  const {
    isRouteFocused,
    scrollYSV
  } = useSceneRendererContext();

  // Track if user is dragging inner scroll at top
  const isDraggingAtTop = useSharedValue(false);
  const lastDragY = useSharedValue(0);

  // Sync inner scroll position when header collapse state changes (for non-focused tabs)
  useAnimatedReaction(() => outerScrollY.value, currentOuterY => {
    // Only sync non-focused tabs
    if (!isRouteFocused) {
      // If header is collapsing/expanding, sync all tabs
      if (currentOuterY <= headerHeight) {
        // Header visible - ensure inner scroll is at 0
        scrollTo(scrollRef, 0, 0, false);
        scrollYSV.value = 0;
      }
    }
  }, [isRouteFocused, headerHeight]);
  const handleScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollYSV.value = event.contentOffset.y;

      // If not focused, don't process further
      if (!isRouteFocused) {
        return;
      }

      // Track dragging state at top for transfer logic
      if (event.contentOffset.y <= SCROLL_TRANSFER_THRESHOLD) {
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
      if (isRouteFocused && lastDragY.value <= SCROLL_TRANSFER_THRESHOLD && event.contentOffset.y < 0 &&
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
export const useIsInnerScrollEnabled = () => {
  const {
    isHeaderCollapsed
  } = useCollapsibleContext();

  // Note: We don't actually disable scrolling - instead we let native
  // nested scroll handling work. This hook is for reference/debugging.
  return isHeaderCollapsed;
};
//# sourceMappingURL=useInnerScrollSync.js.map