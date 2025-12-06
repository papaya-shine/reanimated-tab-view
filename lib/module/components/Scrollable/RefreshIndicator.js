import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useHeaderContext } from '../../providers/Header';
import { usePropsContext } from '../../providers/Props';
import { REFRESH_TRIGGER_THRESHOLD, REFRESH_OPACITY_START_FACTOR, REFRESH_OPACITY_MID, REFRESH_DEFAULT_COLOR } from '../../constants/refresh';
import { animateRefreshOverscrollToZero } from '../../hooks/scrollable/useRefreshHelpers';

/**
 * RefreshIndicator component that floats on top of content and moves with it
 */
export const RefreshIndicator = /*#__PURE__*/React.memo(() => {
  const {
    refreshOverscrollSV
  } = useHeaderContext();
  const {
    refreshing,
    refreshControlColor,
    onRefresh
  } = usePropsContext();

  // Track previous refreshing state to detect when refresh completes
  const wasRefreshingRef = useRef(refreshing);

  // When refreshing changes from true to false, animate spinner back to 0
  useEffect(() => {
    if (wasRefreshingRef.current && !refreshing) {
      // Refresh just completed, animate back to 0
      animateRefreshOverscrollToZero(refreshOverscrollSV);
    }
    wasRefreshingRef.current = refreshing;
  }, [refreshing, refreshOverscrollSV]);
  const animatedContainerStyle = useAnimatedStyle(() => {
    // Height grows with pull, capped at 60. This pushes content down naturally.
    const height = refreshing ? 60 : Math.min(refreshOverscrollSV.value, 60);
    const opacity = interpolate(refreshOverscrollSV.value, [0, REFRESH_TRIGGER_THRESHOLD * REFRESH_OPACITY_START_FACTOR, REFRESH_TRIGGER_THRESHOLD], [0, REFRESH_OPACITY_MID, 1], Extrapolation.CLAMP);
    return {
      height,
      opacity: refreshing ? 1 : opacity
    };
  });
  const animatedSpinnerStyle = useAnimatedStyle(() => {
    const scale = interpolate(refreshOverscrollSV.value, [0, REFRESH_TRIGGER_THRESHOLD], [0.3, 1], Extrapolation.CLAMP);
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
  return /*#__PURE__*/React.createElement(Animated.View, {
    style: [styles.refreshIndicatorContainer, animatedContainerStyle]
  }, /*#__PURE__*/React.createElement(Animated.View, {
    style: animatedSpinnerStyle
  }, /*#__PURE__*/React.createElement(ActivityIndicator, {
    size: "large",
    color: refreshControlColor || REFRESH_DEFAULT_COLOR,
    animating: true
  })));
});
const styles = StyleSheet.create({
  refreshIndicatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  }
});
//# sourceMappingURL=RefreshIndicator.js.map