import { getEnumKeys } from "./getEnumKeys.js";

/** Used to get the values of an enum. Use the following syntax: values<Enum>(Enum); */
export function getEnumValues<T>(_enum: any): T[] {
	return getEnumKeys(_enum).map(key => _enum[key] as T);
}
