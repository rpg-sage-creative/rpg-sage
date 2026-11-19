import type { EnumLike } from "../generics.js";
import { getEnumKeys } from "./getEnumKeys.js";
import { getEnumValues } from "./getEnumValues.js";
import { parseEnum } from "./parseEnum.js";

/** Provides functionality common to all TypeScript enum "objects". */
export const Enum = { keys:getEnumKeys, parse:parseEnum, values:getEnumValues };

export interface Enum {
	/** Used to get the keys of an enum. Use the following syntax: keys(Enum); */
	keys<K extends string>(enumLike: EnumLike<K>): K[];

	/** Returns the (number) value of the enum for the given string value (ignoring case), or undefined. */
	parse<K extends string, V extends number>(enumLike: EnumLike<K, V>, value: string): V | undefined;

	/** Returns the (number) value of the enum for the given value, or undefined. */
	parse<K extends string, V extends number>(enumLike: EnumLike<K, V>, value: number): V | undefined;

	/** Returns the (number) value of the enum for the given string value (ignoring case), or the given defaultValue. */
	parse<K extends string, V extends number>(enumLike: EnumLike<K, V>, value: string, defaultValue: V): V;

	/** Returns the (number) value of the enum for the given value, or the given defaultValue. */
	parse<K extends string, V extends number>(enumLike: EnumLike<K, V>, value: number, defaultValue: V): V;

	/** Used to get the values of an enum. Use the following syntax: values(Enum); */
	values<K extends string, V extends number>(enumLike: EnumLike<K, V>): V[];
};
