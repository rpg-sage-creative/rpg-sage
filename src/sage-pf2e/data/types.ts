import type { Base } from "../model/base/Base";

export type BaseFilterCallbackFn<T extends Base> = (value: T, index: number, array: T[]) => boolean;
