import type { SortResult } from "./SortResult.js";

export interface Comparable<T> {
	compareTo(other: Comparable<T>): SortResult;
}