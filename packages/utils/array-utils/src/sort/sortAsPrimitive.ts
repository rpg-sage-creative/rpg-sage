import { isDefined } from "@rsc-utils/type-utils";
import type { Sorter } from "./Sorter.js";
import { getDataConverter } from "./internal/getDataConverter.js";
import { sortPrimitive } from "./sortPrimitive.js";
import { sortStringIgnoreCase } from "./sortStringIgnoreCase.js";

/** Returns a sorter that sorts values in ascending order as Date objects using new Date() to convert them. */
export function sortAsPrimitive<T>(dataType: "date"): Sorter<T>;

/** Returns a sorter that sorts values in ascending order as numbers using Number() to convert them. */
export function sortAsPrimitive<T>(dataType: "number"): Sorter<T>;

/** Returns a sorter that sorts values in ascending order as strings using String() to convert them. */
export function sortAsPrimitive<T>(dataType: "string"): Sorter<T>;

/** Returns a sorter that sorts values in ascending order as strings (case insensitive) using String() to convert them. */
export function sortAsPrimitive<T>(dataType: "string", ignoreCase: true): Sorter<T>;

export function sortAsPrimitive(dataType: "date" | "number" | "string", ignoreCase?: true): Sorter {
	// converts to the data type
	const dataConverter = getDataConverter(dataType);

	// allows null/undefined to not be converted, ex: "null" / "undefined"
	const valueConverter = (value: any) => isDefined(value) ? dataConverter(value) : value;

	// ignore case has separate sorting
	const sorter = ignoreCase === true ? sortStringIgnoreCase : sortPrimitive;

	// return final sorter
	return (a: any, b: any) => sorter(valueConverter(a), valueConverter(b));
}
