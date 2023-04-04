import { randomItem } from "../../sage-utils/RandomUtils";
import type { TEntity } from "../model";
import type { Base } from "../model/base/Base";
import type { BaseFilterCallbackFn } from "./types";
import { getByType } from "./repoMap";

/** Returns a random object for the given objectType. If a predicate is given, the objects are filtered before selection. */
export function random<T extends string>(objectType: T): TEntity<T>;
export function random<T extends Base>(objectType: string, predicate: BaseFilterCallbackFn<T>): T;
export function random<T extends Base>(objectType: string, predicate?: BaseFilterCallbackFn<T>): T {
	const objects: T[] = getByType(objectType);
	return randomItem(predicate ? objects.filter(predicate) : objects)!;
}
