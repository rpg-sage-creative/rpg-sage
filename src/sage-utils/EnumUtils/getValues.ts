import { getKeys } from "./getKeys";
import { EnumLike } from "./parse";

/** Used to get the values of a numerical enum. Use the following syntax: values<Enum>(Enum); */
export function getValues<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>): V[] {
	return getKeys(enumLike).map(key => enumLike[key]);
}
