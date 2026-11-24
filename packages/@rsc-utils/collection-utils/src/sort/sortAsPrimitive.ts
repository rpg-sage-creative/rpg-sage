import { isDefined } from "@rsc-utils/type-utils";
import { isDate } from "node:util/types";
import { sortPrimitive } from "./sortPrimitive.js";
import type { Sorter } from "./types.js";

/** Creates a sorter that sorts values in ascending order as Date objects using new Date() to convert them. */
export function sortAsPrimitive<T>(dataType: "date"): Sorter<T>;

/** Creates a sorter that sorts values in ascending order as numbers using Number() to convert them. */
export function sortAsPrimitive<T>(dataType: "number"): Sorter<T>;

/** Creates a sorter that sorts values in ascending order as strings (case insensitive) using String() to convert them. */
export function sortAsPrimitive<T>(dataType: "string"): Sorter<T>;

export function sortAsPrimitive(dataType: "date" | "number" | "string"): Sorter<unknown> {
	// converts to the data type
	let dataConverter: (value: unknown) => Date | number | string = String;
	if (dataType === "date") {
		dataConverter = (value: unknown) => new Date(value as "date");
	}else if (dataType === "number") {
		dataConverter = Number;
	}

	// allows null/undefined to not be converted, ex: "null" / "undefined"
	const valueConverter = (value: unknown) => isDefined(value) ? dataConverter(value) : value;

	// return final sorter
	return (a: unknown, b: unknown) => {
		// sort by value
		const result = sortPrimitive(valueConverter(a), valueConverter(b));
		if (result !== 0) {
			return result;
		}

		// sort by type
		const aType = isDate(a) ? "date" : typeof(a);
		const bType = isDate(b) ? "date" : typeof(b);
		if (aType !== bType) {
			return aType < bType ? -1 : 1;
		}

		// return equal
		return 0;
	};
}
