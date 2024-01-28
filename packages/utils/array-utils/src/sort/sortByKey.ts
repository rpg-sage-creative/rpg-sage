import { or } from "../or.js";
import type { Sorter } from "./Sorter.js";
import { sortPrimitive } from "./sortPrimitive.js";
import { sortStringIgnoreCase } from "./sortStringIgnoreCase.js";

export function sortByKey<T>(key: keyof T): Sorter<T>;
export function sortByKey<T>(key: keyof T, ignoreCase: true): Sorter<T>;
export function sortByKey<T>(ignoreCase: true, ...keys: (keyof T)[]): Sorter<T>;
export function sortByKey<T>(...args: (keyof T | true)[]): Function {
	const ignoreCase = args.includes(true);
	const keys = args.filter(arg => typeof(arg) === "string") as (keyof T)[];
	const sorters: Sorter[] = keys.map(key => {
		return (a: T, b: T) => {
			// casting as string allows toLowerCase to be valid
			const aValue = a?.[key] as string;
			const bValue = b?.[key] as string;
			if (ignoreCase) {
				return sortStringIgnoreCase(aValue, bValue, false);
			}
			return sortPrimitive(aValue, bValue);
		};
	});
	return or(...sorters);
}
