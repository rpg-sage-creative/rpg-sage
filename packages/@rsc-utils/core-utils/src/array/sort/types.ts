import type { Optional } from "@rsc-utils/type-utils";

export type SortResult = -1 | 0 | 1;

export type Sorter<T> = (a: Optional<T>, b: Optional<T>) => SortResult;

export interface Comparable<T> {
	compareTo(other: Comparable<T>): SortResult;
}