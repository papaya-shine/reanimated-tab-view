import {
  useAnimatedScrollHandler,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { NativeScrollEvent } from 'react-native';
import { useCollapsibleContext } from '../../providers/Collapsible';
import { SCROLL_SNAP_DURATION } from '../../constants/collapsible';

/**
 * Hook that handles the outer scroll view's scroll events.
 *
 * The outer scroll manages:
 * 1. Header collapse (scrolling the header away)
 * 2. Sticky tab bar behavior
 * 3. Triggering refresh when at top and pulling down
 */
export const useOuterScrollHandler = () => {
  const {
    outerScrollY,
    isHeaderCollapsed,
    headerHeight,
  } = useCollapsibleContext();

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event: NativeScrollEvent) => {
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
    onEndDrag: (event: NativeScrollEvent) => {
      // Optional: snap to fully collapsed or expanded if in between
      const scrollY = event.contentOffset.y;
      const halfHeader = headerHeight / 2;

      // Only snap if header is partially visible
      if (scrollY > 0 && scrollY < headerHeight) {
        if (scrollY < halfHeader) {
          // Snap to fully expanded (scroll to 0)
          outerScrollY.value = withTiming(0, {
            duration: SCROLL_SNAP_DURATION,
            easing: Easing.out(Easing.ease),
          });
        } else {
          // Snap to fully collapsed (scroll to headerHeight)
          outerScrollY.value = withTiming(headerHeight, {
            duration: SCROLL_SNAP_DURATION,
            easing: Easing.out(Easing.ease),
          });
        }
      }
    },
  });

  return handleScroll;
};

/**
 * Hook to get the animated style for the sticky tab bar.
 * The tab bar should stick at the top when the header is scrolled away.
 */
export const useStickyTabBarStyle = () => {
  // Note: We use stickyHeaderIndices on the ScrollView instead of manual sticky
  // This is more performant and uses native sticky header behavior
  return null;
};

