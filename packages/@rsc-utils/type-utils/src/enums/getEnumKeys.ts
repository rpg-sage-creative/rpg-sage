import type { EnumLike } from "../generics.js";

/** Used to get the keys of an enum. Use the following syntax: getEnumKeys(Enum); */
export function getEnumKeys<K extends string>(enumLike: EnumLike<K>): K[] {
	return (Object.keys(enumLike) as K[])
		.filter(key => typeof(enumLike[key]) === "number");
}
