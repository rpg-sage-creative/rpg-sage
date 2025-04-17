import type { Optional } from "../../types/generics.js";
import type { SortResult } from "./SortResult.js";

export type Sorter<T> = (a: Optional<T>, b: Optional<T>) => SortResult;