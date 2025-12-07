import React, { forwardRef, useImperativeHandle, useMemo, useState, useEffect } from 'react';
import Animated, {
  useAnimatedRef,
} from 'react-native-reanimated';
import { StyleSheet, RefreshControl } from 'react-native';
import type { ScrollView } from 'react-native';

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
export const RTVScrollViewWithoutScrollHandler = React.memo(
  forwardRef<
    React.ForwardedRef<Animated.ScrollView>,
    React.ComponentProps<typeof ScrollView>
  >((props, ref) => {
    const {
      children,
      refreshControl: userProvidedRefreshControl,
      contentContainerStyle,
      scrollEnabled: userScrollEnabled = true,
      ...rest
    } = props;

    const { tabViewCarouselLayout } = useInternalContext();
    const { renderHeader, refreshing, onRefresh, refreshControlColor } = usePropsContext();

    const scrollRef = useAnimatedRef<Animated.ScrollView>();

    // Check if we're in collapsible mode (has renderHeader)
    const isCollapsibleMode = !!renderHeader;

    // Content container style - simplified for both modes
    const finalContentContainerStyle = useMemo(() => {
      return [
        styles.contentContainer,
        {
          minHeight: tabViewCarouselLayout.height,
          flexGrow: 1,
        },
        contentContainerStyle,
      ];
    }, [tabViewCarouselLayout.height, contentContainerStyle]);

    useImperativeHandle(ref, () => scrollRef.current as any);

    // Only sync with pan translation in legacy scenarios
    // In new collapsible mode, outer scroll handles everything
    if (!isCollapsibleMode) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSyncScrollWithPanTranslation(scrollRef as any);
    }

    // Extract tintColor from user-provided RefreshControl or context
    const userTintColor = userProvidedRefreshControl 
      ? (userProvidedRefreshControl as React.ReactElement<any>).props?.tintColor 
      : refreshControlColor;

    // iOS workaround: Apply tintColor after a short delay
    // (iOS doesn't apply tintColor correctly on initial render)
    const [delayedTintColor, setDelayedTintColor] = useState<string | undefined>(undefined);
    
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
    let finalRefreshControl: React.ReactElement | undefined;

    if (!isCollapsibleMode) {
      if (userProvidedRefreshControl) {
        // Recreate RefreshControl with delayed tintColor for iOS workaround
        const rcProps = (userProvidedRefreshControl as React.ReactElement<any>).props || {};
        finalRefreshControl = (
          <RefreshControl
            refreshing={rcProps.refreshing ?? false}
            onRefresh={rcProps.onRefresh}
            tintColor={delayedTintColor}
            colors={rcProps.colors}
            title={rcProps.title}
            titleColor={rcProps.titleColor}
            progressBackgroundColor={rcProps.progressBackgroundColor}
            progressViewOffset={rcProps.progressViewOffset}
            size={rcProps.size}
          />
        );
      } else if (onRefresh) {
        finalRefreshControl = (
          <RefreshControl
            refreshing={refreshing ?? false}
            onRefresh={onRefresh}
            tintColor={delayedTintColor}
            colors={refreshControlColor ? [refreshControlColor] : undefined}
          />
        );
      }
    }

    return (
      <Animated.ScrollView
        ref={scrollRef}
        {...rest}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        scrollEnabled={userScrollEnabled}
        contentContainerStyle={finalContentContainerStyle}
        refreshControl={finalRefreshControl as any}
      >
        {children}
      </Animated.ScrollView>
    );
  })
);

/**
 * RTVScrollView - With scroll handlers
 */
export const RTVScrollView = React.memo(
  forwardRef<
    React.ForwardedRef<Animated.ScrollView>,
    React.ComponentProps<typeof ScrollView>
  >((props, ref) => {
    const {
      onScroll,
      onScrollEndDrag,
      onScrollBeginDrag,
      onMomentumScrollEnd,
      onMomentumScrollBegin,
      ...rest
    } = props;

    const scrollRef = useAnimatedRef<Animated.ScrollView>();

    const handleScroll = useScrollHandlers({
      onScroll,
      onScrollEndDrag,
      onScrollBeginDrag,
      onMomentumScrollEnd,
      onMomentumScrollBegin,
    });

    useImperativeHandle(ref, () => scrollRef.current as any);

    return (
      <RTVScrollViewWithoutScrollHandler
        {...rest}
        onScroll={handleScroll as any}
        ref={ref}
      />
    );
  })
);

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
});
