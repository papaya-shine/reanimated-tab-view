function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import Animated from 'react-native-reanimated';
import { RTVScrollViewWithoutScrollHandler } from './RTVScrollView';
import { useScrollHandlers } from '../../hooks/scrollable/useScrollHandlers';
function _RTVFlatList(props, ref) {
  const {
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
    ...restProps
  } = props;
  const flatListRef = useRef(null);
  const handleScroll = useScrollHandlers({
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin
  });
  const renderScrollComponent = useCallback(scrollViewProps => {
    return /*#__PURE__*/React.createElement(RTVScrollViewWithoutScrollHandler, scrollViewProps);
  }, []);
  useImperativeHandle(ref, () => flatListRef.current);
  return /*#__PURE__*/React.createElement(Animated.FlatList, _extends({
    ref: flatListRef
  }, restProps, {
    renderScrollComponent: renderScrollComponent,
    onScroll: handleScroll
  }));
}
export const RTVFlatList = /*#__PURE__*/React.memo( /*#__PURE__*/forwardRef(_RTVFlatList));
//# sourceMappingURL=RTVFlatList.js.map