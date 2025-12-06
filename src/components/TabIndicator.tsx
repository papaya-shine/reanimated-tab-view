import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { TabIndicatorProps } from '../types/TabIndicator';
import { useTabLayoutContext } from '../providers/TabLayout';
import { useInternalContext } from '../providers/Internal';
import { usePropsContext } from '../providers/Props';

const TabIndicator = React.memo((props: TabIndicatorProps) => {
  const { style } = props;

  const { tabBarType, tabBarPosition, tabBarIndicatorStyle } =
    usePropsContext();
  const { animatedRouteIndex } = useInternalContext();

  const {
    routeIndexToTabWidthMapSV,
    routeIndexToTabContentWidthMapSV,
  } = useTabLayoutContext();

  const animatedTabIndicatorContainerStyle = useAnimatedStyle(() => {
    const fromIndex = Math.floor(animatedRouteIndex.value);
    const toIndex = Math.ceil(animatedRouteIndex.value);
    const progress = animatedRouteIndex.value - fromIndex;
    
    // Calculate translateX for fromIndex (sum of widths up to fromIndex)
    let fromTranslateX = 0;
    for (let i = 0; i < fromIndex; i++) {
      fromTranslateX += routeIndexToTabWidthMapSV.value[i] ?? 0;
    }
    
    // Calculate translateX for toIndex (sum of widths up to toIndex)
    let toTranslateX = 0;
    for (let i = 0; i < toIndex; i++) {
      toTranslateX += routeIndexToTabWidthMapSV.value[i] ?? 0;
    }
    
    // Get widths for interpolation
    const fromTabWidth = routeIndexToTabWidthMapSV.value[fromIndex] ?? 0;
    const toTabWidth = routeIndexToTabWidthMapSV.value[toIndex] ?? 0;
    const fromContentWidth = routeIndexToTabContentWidthMapSV.value[fromIndex] ?? 0;
    const toContentWidth = routeIndexToTabContentWidthMapSV.value[toIndex] ?? 0;
    
    // For primary tabs, center the indicator on the tab content
    let finalTranslateX = fromTranslateX + (toTranslateX - fromTranslateX) * progress;
    let width = fromTabWidth + (toTabWidth - fromTabWidth) * progress;
    
    if (tabBarType === 'primary') {
      // For primary tabs, center the indicator on the tab content
      const fromCenterOffset = (fromTabWidth - fromContentWidth) / 2;
      const toCenterOffset = (toTabWidth - toContentWidth) / 2;
      const centerOffset = fromCenterOffset + (toCenterOffset - fromCenterOffset) * progress;
      
      finalTranslateX += centerOffset;
      width = fromContentWidth + (toContentWidth - fromContentWidth) * progress;
    }

    return { 
      transform: [{ translateX: finalTranslateX }], 
      width
    };
  }, [tabBarType]);

  return (
    <Animated.View
      style={[styles.tabIndicatorContainer, animatedTabIndicatorContainerStyle]}
    >
      <Animated.View
        style={[
          styles.tabIndicator,
          tabBarType === 'primary' && styles.primaryTabIndicator,
          tabBarPosition === 'top' && styles.topTabIndicator,
          tabBarPosition === 'bottom' && styles.bottomTabIndicator,
          tabBarIndicatorStyle as any,
          style as any,
        ]}
      />
    </Animated.View>
  );
});
export default TabIndicator;

const styles = StyleSheet.create({
  tabIndicatorContainer: {
    position: 'absolute',
    left: 0,
    height: '100%',
    justifyContent: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '100%',
    backgroundColor: 'yellow',
  },
  topTabIndicator: {
    bottom: 0,
  },
  bottomTabIndicator: {
    top: 0,
  },
  primaryTabIndicator: {
    borderTopRightRadius: 2,
    borderTopLeftRadius: 2,
  },
});
