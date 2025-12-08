import React, { type ForwardedRef } from 'react';
import { FlashList, type FlashListProps } from '@shopify/flash-list';
/**
 * RTVFlashList - High-performance FlashList component for use within TabView
 *
 * This is a drop-in replacement for RTVFlatList that uses @shopify/flash-list
 * for better performance with large lists and complex items.
 *
 * IMPORTANT: You must provide `estimatedItemSize` prop (required by FlashList)
 *
 * In COLLAPSIBLE mode:
 * - scrollEnabled={false} - outer ScrollView handles all gestures
 * - Reports content height to context (keyed by route)
 * - Syncs scroll position from outer scroll via useAnimatedReaction
 * - Viewport height comes from parent container, NOT from FlashList's onLayout
 *   (because with scrollEnabled={false}, FlashList expands to fit content)
 *
 * In STATIC mode:
 * - Normal scrolling behavior
 * - Can have its own RefreshControl
 */
declare function RTVFlashListInner<T>(props: FlashListProps<T> & {
    routeKey?: string;
}, ref: React.ForwardedRef<FlashList<T>>): JSX.Element;
export declare const RTVFlashList: <T>(props: FlashListProps<T> & {
    ref?: React.ForwardedRef<FlashList<T>> | undefined;
    routeKey?: string | undefined;
}) => ReturnType<typeof RTVFlashListInner>;
export {};
//# sourceMappingURL=RTVFlashList.d.ts.map