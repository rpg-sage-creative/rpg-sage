import type { Filter } from "./Filter.js";

// shared noop for empty filter arrays - true keeps everything (vacuous truth)
const AndNoop = () => true;

/**
 * Creates a single Filter function that tests each array element against the given filters.
 * If any given filter returns "falsey", the returned value is the first "falsey" value.
 * Otherwise the returned value is the "truthy" value from the last tester.
 * With no filters, returns a noop that keeps everything.
 * Ex: .filter(and(isDefined, toUnique)) -> .filter((v, i, a) => isDefined(v, i, a) && toUnique(v, i, a))
 */
export function and<T>(...filters: Filter<T>[]): Filter<T> {
	// if there are no filters, return a shared noop (vacuous truth)
	if (filters.length === 0) {
		return AndNoop;
	}

	// return a solo filter
	if (filters.length === 1) {
		return filters[0];
	}

	const count = filters.length;
	return (value: any, index: number, array: any[]) => {
		let result;
		for (let i = 0; i < count; i++) {
			result = filters[i](value, index, array);
			// if the result is "falsey", return it now to stop testing
			if (!result) {
				return result;
			}
		}

		// return the last "truthy" result
		return result;
	};
}