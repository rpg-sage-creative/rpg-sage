import { EnumLike } from "./parse";

/** Used to get the keys of a numerical enum. Use the following syntax: keys<typeof Enum>(Enum); */
export function getKeys<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>): K[] {
	return Object.keys(enumLike).filter(key => typeof(key) === "string") as K[];
}
