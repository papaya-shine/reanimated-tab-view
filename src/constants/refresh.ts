import { Easing } from 'react-native-reanimated';

// Threshold for triggering refresh from header pull (in pixels)
export const REFRESH_TRIGGER_THRESHOLD = 80;

// Smaller threshold for triggering refresh from list content pull (iOS only)
// Content overscroll has less travel distance than header pull
export const REFRESH_SCROLL_THRESHOLD = 40;

// Resistance factor applied to pull distance for smoother feel
export const REFRESH_RESISTANCE_FACTOR = 0.5;

// Animation duration for refresh indicator
export const REFRESH_ANIMATION_DURATION = 250;

// Standard animation config for refresh indicator
export const REFRESH_ANIMATION_CONFIG = {
  duration: REFRESH_ANIMATION_DURATION,
  easing: Easing.out(Easing.cubic),
} as const;

// Opacity animation breakpoints
export const REFRESH_OPACITY_START_FACTOR = 0.3;
export const REFRESH_OPACITY_MID = 0.7;

// Default refresh indicator color
export const REFRESH_DEFAULT_COLOR = '#0095F6';

// iOS workaround: Delay (ms) before applying tintColor to RefreshControl
// iOS doesn't apply tintColor correctly on initial render, especially in release builds
export const IOS_REFRESH_TINT_COLOR_DELAY = 300;

