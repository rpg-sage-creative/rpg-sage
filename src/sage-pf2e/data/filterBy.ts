import type { TEntity } from "../model";
import { getByType } from "./repoMap";
import type { BaseFilterCallbackFn } from "./types";

/** Filters the objects of the given objectType using the given predicate. */
export function filterBy<T extends string, U extends TEntity<T> = TEntity<T>>(objectType: T, predicate: BaseFilterCallbackFn<U>): U[] {
	return getByType<U>(objectType).filter(predicate);
}
