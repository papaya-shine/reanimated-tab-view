function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedRef, useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { useHeaderContext } from '../../providers/Header';
import { useInternalContext } from '../../providers/Internal';
import { useScrollHandlers } from '../../hooks/scrollable/useScrollHandlers';
import { useSyncScrollWithPanTranslation } from '../../hooks/scrollable/useSyncScrollWithPanTranslation';
import { SHOULD_RENDER_ABSOLUTE_HEADER } from '../../constants/scrollable';
export const RTVScrollViewWithoutScrollHandler = /*#__PURE__*/React.memo( /*#__PURE__*/forwardRef((props, ref) => {
  //#region props
  const {
    children,
    ...rest
  } = props;
  //#endregion

  //#region context
  const {
    animatedTranslateYSV
  } = useHeaderContext();
  const {
    tabViewHeaderLayout,
    tabBarLayout,
    tabViewCarouselLayout
  } = useInternalContext();

  //#endregion

  //#region variables
  const scrollRef = useAnimatedRef();
  const scrollGesture = useMemo(() => Gesture.Native().shouldCancelWhenOutside(false).disallowInterruption(true), []);
  //#endregion

  //#region styles
  const animatedContentContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{
        translateY: animatedTranslateYSV.value
      }]
    };
  }, [animatedTranslateYSV]);
  const translatingContentContainerStyle = useMemo(() => {
    return [animatedContentContainerStyle, {
      paddingBottom: tabViewHeaderLayout.height,
      minHeight: tabViewCarouselLayout.height + tabViewHeaderLayout.height
    }];
  }, [animatedContentContainerStyle, tabViewCarouselLayout.height, tabViewHeaderLayout.height]);
  const nonTranslatingContentContainerStyle = useMemo(() => {
    return {
      paddingTop: tabBarLayout.height + tabViewHeaderLayout.height,
      minHeight: tabViewCarouselLayout.height + tabViewHeaderLayout.height
    };
  }, [tabBarLayout.height, tabViewCarouselLayout.height, tabViewHeaderLayout.height]);
  //#endregion

  //#region hooks
  useImperativeHandle(ref, () => scrollRef.current);
  useSyncScrollWithPanTranslation(scrollRef);
  //#endregion

  //#region render
  return /*#__PURE__*/React.createElement(GestureDetector, {
    gesture: scrollGesture
  }, /*#__PURE__*/React.createElement(Animated.ScrollView, _extends({
    ref: scrollRef
  }, rest, {
    scrollEventThrottle: 16
  }), SHOULD_RENDER_ABSOLUTE_HEADER ? /*#__PURE__*/React.createElement(Animated.View, {
    style: [styles.contentContainer, nonTranslatingContentContainerStyle]
  }, children) : /*#__PURE__*/React.createElement(Animated.View, {
    style: [styles.contentContainer, translatingContentContainerStyle]
  }, children)));
  //#endregion
}));
export const RTVScrollView = /*#__PURE__*/React.memo( /*#__PURE__*/forwardRef((props, ref) => {
  //#region props
  const {
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
    ...rest
  } = props;
  //#endregion

  //#region variables
  const scrollRef = useAnimatedRef();
  const handleScroll = useScrollHandlers({
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin
  });
  //#endregion

  //#region hooks
  useImperativeHandle(ref, () => scrollRef.current);
  //#endregion

  //#region render
  return /*#__PURE__*/React.createElement(RTVScrollViewWithoutScrollHandler, _extends({}, rest, {
    onScroll: handleScroll,
    ref: ref
  }));
  //#endregion
}));
const styles = StyleSheet.create({
  contentContainer: {
    flex: 1
  }
});
//# sourceMappingURL=RTVScrollView.js.map