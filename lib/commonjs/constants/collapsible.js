"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VELOCITY_TRANSFER_THRESHOLD = exports.SCROLL_TRANSFER_THRESHOLD = exports.SCROLL_SNAP_DURATION = exports.REFRESH_PULL_THRESHOLD = exports.MIN_HEADER_COLLAPSE_FOR_INNER_SCROLL = void 0;
/**
 * Constants for the collapsible scroll architecture
 */

// Threshold for determining when to transfer scroll control
// from outer (header) scroll to inner (content) scroll
const SCROLL_TRANSFER_THRESHOLD = exports.SCROLL_TRANSFER_THRESHOLD = 5;

// Velocity threshold for momentum transfer between scrolls
const VELOCITY_TRANSFER_THRESHOLD = exports.VELOCITY_TRANSFER_THRESHOLD = 50;

// Minimum header collapse before allowing inner scroll
const MIN_HEADER_COLLAPSE_FOR_INNER_SCROLL = exports.MIN_HEADER_COLLAPSE_FOR_INNER_SCROLL = 0.95; // 95% collapsed

// Animation duration for scroll position snapping
const SCROLL_SNAP_DURATION = exports.SCROLL_SNAP_DURATION = 200;

// RefreshControl pull distance threshold
const REFRESH_PULL_THRESHOLD = exports.REFRESH_PULL_THRESHOLD = 80;
//# sourceMappingURL=collapsible.js.map