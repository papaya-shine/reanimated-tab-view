import React, { type ForwardedRef } from 'react';
import { FlashList, type FlashListProps } from '@shopify/flash-list';
export type RTVFlashListProps<T> = Omit<FlashListProps<T>, 'estimatedItemSize'> & {
    routeKey?: string;
    estimatedItemSize: number;
};
export declare const RTVFlashList: <T>(props: Omit<FlashListProps<T>, "estimatedItemSize"> & {
    routeKey?: string | undefined;
    estimatedItemSize: number;
} & {
    ref?: React.ForwardedRef<FlashList<T>> | undefined;
}) => React.ReactElement | null;
//# sourceMappingURL=RTVFlashList.d.ts.map