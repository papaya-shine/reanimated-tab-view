function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import React, { forwardRef, useImperativeHandle, useMemo, useState, useEffect } from 'react';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { StyleSheet, RefreshControl } from 'react-native';
import { useInternalContext } from '../../providers/Internal';
import { usePropsContext } from '../../providers/Props';
import { useScrollHandlers } from '../../hooks/scrollable/useScrollHandlers';
import { useSyncScrollWithPanTranslation } from '../../hooks/scrollable/useSyncScrollWithPanTranslation';

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
export const RTVScrollViewWithoutScrollHandler = /*#__PURE__*/React.memo( /*#__PURE__*/forwardRef((props, ref) => {
  var _props;
  const {
    children,
    refreshControl: userProvidedRefreshControl,
    contentContainerStyle,
    scrollEnabled: userScrollEnabled = true,
    ...rest
  } = props;
  const {
    tabViewCarouselLayout
  } = useInternalContext();
  const {
    renderHeader,
    refreshing,
    onRefresh,
    refreshControlColor
  } = usePropsContext();
  const scrollRef = useAnimatedRef();

  // Check if we're in collapsible mode (has renderHeader)
  const isCollapsibleMode = !!renderHeader;

  // Content container style - simplified for both modes
  const finalContentContainerStyle = useMemo(() => {
    return [styles.contentContainer, {
      minHeight: tabViewCarouselLayout.height,
      flexGrow: 1
    }, contentContainerStyle];
  }, [tabViewCarouselLayout.height, contentContainerStyle]);
  useImperativeHandle(ref, () => scrollRef.current);

  // Only sync with pan translation in legacy scenarios
  // In new collapsible mode, outer scroll handles everything
  if (!isCollapsibleMode) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSyncScrollWithPanTranslation(scrollRef);
  }

  // Extract tintColor from user-provided RefreshControl or context
  const userTintColor = userProvidedRefreshControl ? (_props = userProvidedRefreshControl.props) === null || _props === void 0 ? void 0 : _props.tintColor : refreshControlColor;

  // iOS workaround: Apply tintColor after a short delay
  // (iOS doesn't apply tintColor correctly on initial render)
  const [delayedTintColor, setDelayedTintColor] = useState(undefined);
  useEffect(() => {
    if (userTintColor) {
      const timer = setTimeout(() => {
        setDelayedTintColor(userTintColor);
      }, 100);
      return () => clearTimeout(timer);
    }
    setDelayedTintColor(undefined);
    return undefined;
  }, [userTintColor]);

  // Determine RefreshControl:
  // 1. In collapsible mode: NO RefreshControl (outer scroll has it)
  // 2. In static mode with user-provided refreshControl: recreate with delayed tintColor
  // 3. In static mode with TabView's onRefresh: create one with delayed tintColor
  // 4. Otherwise: no RefreshControl
  let finalRefreshControl;
  if (!isCollapsibleMode) {
    if (userProvidedRefreshControl) {
      // Recreate RefreshControl with delayed tintColor for iOS workaround
      const rcProps = userProvidedRefreshControl.props || {};
      finalRefreshControl = /*#__PURE__*/React.createElement(RefreshControl, {
        refreshing: rcProps.refreshing ?? false,
        onRefresh: rcProps.onRefresh,
        tintColor: delayedTintColor,
        colors: rcProps.colors,
        title: rcProps.title,
        titleColor: rcProps.titleColor,
        progressBackgroundColor: rcProps.progressBackgroundColor,
        progressViewOffset: rcProps.progressViewOffset,
        size: rcProps.size
      });
    } else if (onRefresh) {
      finalRefreshControl = /*#__PURE__*/React.createElement(RefreshControl, {
        refreshing: refreshing ?? false,
        onRefresh: onRefresh,
        tintColor: delayedTintColor,
        colors: refreshControlColor ? [refreshControlColor] : undefined
      });
    }
  }
  return /*#__PURE__*/React.createElement(Animated.ScrollView, _extends({
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
export const RTVScrollView = /*#__PURE__*/React.memo( /*#__PURE__*/forwardRef((props, ref) => {
  const {
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
    ...rest
  } = props;
  const scrollRef = useAnimatedRef();
  const handleScroll = useScrollHandlers({
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin
  });
  useImperativeHandle(ref, () => scrollRef.current);
  return /*#__PURE__*/React.createElement(RTVScrollViewWithoutScrollHandler, _extends({}, rest, {
    onScroll: handleScroll,
    ref: ref
  }));
}));
const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1
  }
});
//# sourceMappingURL=RTVScrollView.js.map