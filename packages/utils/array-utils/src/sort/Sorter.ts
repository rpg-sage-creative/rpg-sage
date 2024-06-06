import type { Optional } from "@rsc-utils/core-utils";
import type { SortResult } from "./SortResult.js";

export type Sorter<T> = (a: Optional<T>, b: Optional<T>) => SortResult;