import type { EnumLike } from "../generics.js";

/** Used to get the values of an enum. Use the following syntax: getEnumValues(Enum); */
export function getEnumValues<K extends string, V extends number>(enumLike: EnumLike<K, V>): V[] {
	return Object.values(enumLike)
		.filter(value => typeof(value) === "number") as V[];
}
