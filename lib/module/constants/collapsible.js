/**
 * Constants for the collapsible scroll architecture
 */

// Threshold for determining when to transfer scroll control
// from outer (header) scroll to inner (content) scroll
export const SCROLL_TRANSFER_THRESHOLD = 5;

// Velocity threshold for momentum transfer between scrolls
export const VELOCITY_TRANSFER_THRESHOLD = 50;

// Minimum header collapse before allowing inner scroll
export const MIN_HEADER_COLLAPSE_FOR_INNER_SCROLL = 0.95; // 95% collapsed

// Animation duration for scroll position snapping
export const SCROLL_SNAP_DURATION = 200;

// RefreshControl pull distance threshold
export const REFRESH_PULL_THRESHOLD = 80;
//# sourceMappingURL=collapsible.js.map