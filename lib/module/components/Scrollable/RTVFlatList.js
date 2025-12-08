function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useEffect } from 'react';
import { RefreshControl } from 'react-native';
import Animated, { scrollTo, useAnimatedReaction, useAnimatedRef } from 'react-native-reanimated';
import { RTVScrollViewWithoutScrollHandler } from './RTVScrollView';
import { useScrollHandlers } from '../../hooks/scrollable/useScrollHandlers';
import { usePropsContext } from '../../providers/Props';
import { useCollapsibleContext } from '../../providers/Collapsible';
import { useInternalContext } from '../../providers/Internal';

/**
 * RTVFlatList - FlatList component for use within TabView
 * 
 * In COLLAPSIBLE mode:
 * - scrollEnabled={false} - outer ScrollView handles all gestures
 * - Reports content height to context (keyed by route)
 * - Syncs scroll position from outer scroll via useAnimatedReaction
 * - Viewport height comes from parent container, NOT from FlatList's onLayout
 *   (because with scrollEnabled={false}, FlatList expands to fit content)
 * 
 * In STATIC mode:
 * - Normal scrolling behavior
 * - Can have its own RefreshControl
 */
function RTVFlatListInner(props, ref) {
  var _routes$currentRouteI;
  const {
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
    onContentSizeChange,
    onLayout,
    refreshControl: userProvidedRefreshControl,
    scrollEnabled: userScrollEnabled = true,
    routeKey: explicitRouteKey,
    ...restProps
  } = props;
  const {
    renderHeader,
    refreshing,
    onRefresh,
    refreshControlColor
  } = usePropsContext();
  const {
    currentRouteIndex,
    routes
  } = useInternalContext();

  // Use animated ref for UI thread access
  const flatListAnimatedRef = useAnimatedRef();

  // Regular ref for JS thread operations
  const flatListRef = useRef(null);
  const maxContentHeightRef = useRef(0);
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

  // Expose ref to parent
  useImperativeHandle(ref, () => flatListRef.current);

  // Check if we're in collapsible mode
  const isCollapsibleMode = !!renderHeader;

  // Get collapsible context
  const collapsibleContext = useCollapsibleContext();

  // Determine the route key for this FlatList
  // Try explicit prop first, then try to infer from current route
  const routeKey = explicitRouteKey || ((_routes$currentRouteI = routes[currentRouteIndex]) === null || _routes$currentRouteI === void 0 ? void 0 : _routes$currentRouteI.key) || 'unknown';

  // Register this FlatList with the collapsible context
  useEffect(() => {
    if (isCollapsibleMode && flatListRef.current) {
      collapsibleContext.registerInnerScroll(routeKey, flatListRef.current);
    }
  }, [isCollapsibleMode, collapsibleContext, routeKey]);

  // Handle content size change - report to context
  // Only report content HEIGHT, not viewport (viewport comes from parent)
  const handleContentSizeChange = useCallback((w, h) => {
    // Track max height we've ever seen for this FlatList
    if (h > maxContentHeightRef.current) {
      maxContentHeightRef.current = h;
      if (isCollapsibleMode) {
        collapsibleContext.setInnerContentHeight(routeKey, h);
      }
    }
    onContentSizeChange === null || onContentSizeChange === void 0 || onContentSizeChange(w, h);
  }, [isCollapsibleMode, onContentSizeChange, collapsibleContext, routeKey]);

  // Handle layout - just pass through, don't report viewport
  // (viewport height is determined by parent container, not FlatList)
  const handleLayout = useCallback(event => {
    onLayout === null || onLayout === void 0 || onLayout(event);
  }, [onLayout]);

  // Sync scroll position from outer scroll (collapsible mode only)
  // This runs on UI thread and syncs the inner FlatList scroll position
  useAnimatedReaction(() => collapsibleContext.innerScrollY.value, innerY => {
    'worklet';

    if (isCollapsibleMode) {
      scrollTo(flatListAnimatedRef, 0, innerY, false);
    }
  }, [isCollapsibleMode]);

  // Sync the regular ref to the animated ref
  const setRefs = useCallback(instance => {
    flatListRef.current = instance;
    flatListAnimatedRef(instance);
  }, [flatListAnimatedRef]);

  // In collapsible mode, don't use custom scroll component
  const scrollComponentProps = isCollapsibleMode ? {} : {
    renderScrollComponent: renderScrollComponent
  };

  // Determine RefreshControl (only for static mode)
  let finalRefreshControl = undefined;
  if (!isCollapsibleMode) {
    if (userProvidedRefreshControl) {
      finalRefreshControl = userProvidedRefreshControl;
    } else if (onRefresh) {
      finalRefreshControl = /*#__PURE__*/React.createElement(RefreshControl, {
        refreshing: refreshing ?? false,
        onRefresh: onRefresh,
        tintColor: refreshControlColor,
        colors: refreshControlColor ? [refreshControlColor] : undefined
      });
    }
  }

  // In collapsible mode: scrollEnabled={false}, outer scroll handles everything
  const effectiveScrollEnabled = isCollapsibleMode ? false : userScrollEnabled;
  return /*#__PURE__*/React.createElement(Animated.FlatList, _extends({
    ref: setRefs
  }, restProps, scrollComponentProps, {
    onScroll: isCollapsibleMode ? undefined : handleScroll,
    onContentSizeChange: handleContentSizeChange,
    onLayout: handleLayout,
    nestedScrollEnabled: true,
    scrollEnabled: effectiveScrollEnabled,
    refreshControl: finalRefreshControl
    // Disable bounce when scroll is disabled
    ,
    bounces: effectiveScrollEnabled
    // Show scrollbar only when scrollable
    ,
    showsVerticalScrollIndicator: effectiveScrollEnabled
  }));
}
export const RTVFlatList = /*#__PURE__*/React.memo( /*#__PURE__*/forwardRef(RTVFlatListInner));
//# sourceMappingURL=RTVFlatList.js.map