import { getEnumKeys } from "./getEnumKeys.js";
import { getEnumValues } from "./getEnumValues.js";
import { parseEnum } from "./parseEnum.js";

/** Provides functionality common to all TypeScript enum "objects". */
export const Enum = { keys:getEnumKeys, parse:parseEnum, values:getEnumValues };

export interface Enum {
	/** Used to get the keys of an enum. Use the following syntax: keys<typeof Enum>(Enum); */
	keys<T>(_enum: any): (keyof T)[];

	/** Returns the (number) value of the enum for the given string value (ignoring case), or undefined. */
	parse<T>(_enum: any, value: string): T | undefined;

	/** Returns the (number) value of the enum for the given value, or undefined. */
	parse<T>(_enum: any, value: number): T | undefined;

	/** Returns the (number) value of the enum for the given string value (ignoring case), or the given defaultValue. */
	parse<T>(_enum: any, value: string, defaultValue: T): T;

	/** Returns the (number) value of the enum for the given value, or the given defaultValue. */
	parse<T>(_enum: any, value: number, defaultValue: T): T;

	/** Used to get the values of an enum. Use the following syntax: values<Enum>(Enum); */
	values<T>(_enum: any): T[];
};