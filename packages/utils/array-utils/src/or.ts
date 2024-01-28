import type { Filter } from "./filter/Filter.js";
import type { Sorter } from "./sort/Sorter.js";

/**
 * Creates a single Filter function that tests each array element against the given filters.
 * If any given filter returns true, the returned filter returns true.
 * Ex: .filter(or(isDefined, toUnique)) -> .filter((v, i, a) => isDefined(v, i, a) || toUnique(v, i, a))
 */
export function or<T>(...filters: Filter<T>[]): Filter<T>;

/**
 * Creates a single Sorter function that tests each pair of values against the given sorters.
 * The sorters are tested in order such that the first result of -1 or 1 is returned.
 * Ex: .sort(or(sortByLevel, sortByName)) -> .sort((a, b) => sortByLevel(a, b) || sortByName(a, b))
 */
export function or<T>(...sorters: Sorter<T>[]): Sorter<T>;

export function or(...testers: Function[]): Function {
	return (value: any, index: number, array: any[]) => {
		let result;
		for (const tester of testers) {
			result = tester(value, index, array);
			// if the result is "truthy", return it now to stop testing
			if (result) {
				return result;
			}
		}
		// return the last "falsey" result (for sorting it should be a 0)
		return result;
	};
}