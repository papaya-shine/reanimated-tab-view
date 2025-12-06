"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.REFRESH_TRIGGER_THRESHOLD = exports.REFRESH_SCROLL_THRESHOLD = exports.REFRESH_RESISTANCE_FACTOR = exports.REFRESH_OPACITY_START_FACTOR = exports.REFRESH_OPACITY_MID = exports.REFRESH_DEFAULT_COLOR = exports.REFRESH_ANIMATION_DURATION = exports.REFRESH_ANIMATION_CONFIG = void 0;
var _reactNativeReanimated = require("react-native-reanimated");
// Threshold for triggering refresh from header pull (in pixels)
const REFRESH_TRIGGER_THRESHOLD = exports.REFRESH_TRIGGER_THRESHOLD = 80;

// Smaller threshold for triggering refresh from list content pull (iOS only)
// Content overscroll has less travel distance than header pull
const REFRESH_SCROLL_THRESHOLD = exports.REFRESH_SCROLL_THRESHOLD = 40;

// Resistance factor applied to pull distance for smoother feel
const REFRESH_RESISTANCE_FACTOR = exports.REFRESH_RESISTANCE_FACTOR = 0.5;

// Animation duration for refresh indicator
const REFRESH_ANIMATION_DURATION = exports.REFRESH_ANIMATION_DURATION = 250;

// Standard animation config for refresh indicator
const REFRESH_ANIMATION_CONFIG = exports.REFRESH_ANIMATION_CONFIG = {
  duration: REFRESH_ANIMATION_DURATION,
  easing: _reactNativeReanimated.Easing.out(_reactNativeReanimated.Easing.cubic)
};

// Opacity animation breakpoints
const REFRESH_OPACITY_START_FACTOR = exports.REFRESH_OPACITY_START_FACTOR = 0.3;
const REFRESH_OPACITY_MID = exports.REFRESH_OPACITY_MID = 0.7;

// Default refresh indicator color
const REFRESH_DEFAULT_COLOR = exports.REFRESH_DEFAULT_COLOR = '#0095F6';
//# sourceMappingURL=refresh.js.map