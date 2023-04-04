import type { OrUndefined } from "../../sage-utils";
import type { Base } from "../model/base/Base";
import type { HasSource } from "../model/base/HasSource";
import type { Source } from "../model/base/Source";
import { getByTypeAndSource } from "./getByTypeAndSource";
import { getByType } from "./repoMap";
import type { BaseFilterCallbackFn } from "./types";

/** Find Source using the given predicate. */
export function findByType(objectType: "Source", predicate: BaseFilterCallbackFn<Source>): OrUndefined<Source>;

/** Find an entity of the given objectType using the given predicate. */
export function findByType<T extends Base>(objectType: string, predicate: BaseFilterCallbackFn<T>): OrUndefined<T>;

/** Find an entity of the given objectType and source using the given predicate. */
export function findByType<T extends HasSource>(objectType: string, source: OrUndefined<string>, predicate: BaseFilterCallbackFn<T>): OrUndefined<T>;

export function findByType<T extends Base | HasSource>(objectType: string, sourceOrPredicate: string | BaseFilterCallbackFn<T> | undefined, predicate?: BaseFilterCallbackFn<T>): OrUndefined<T> {
	if (predicate) {
		return getByTypeAndSource<HasSource>(objectType, sourceOrPredicate as string).find(predicate as BaseFilterCallbackFn<HasSource>) as T;
	}
	return getByType(objectType).find(<BaseFilterCallbackFn<Base>>sourceOrPredicate) as T;
}
