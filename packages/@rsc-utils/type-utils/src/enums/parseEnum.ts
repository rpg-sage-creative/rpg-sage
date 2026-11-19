import type { EnumLike, Optional } from "../generics.js";
import { isNullOrUndefined } from "../typeGuards/isNullOrUndefined.js";

/** Returns the (number) value of the enum for the given string value (ignoring case), or undefined. */
export function parseEnum<K extends string, V extends number>(enumLike: EnumLike<K, V>, value: Optional<string>): V | undefined;

/** Returns the (number) value of the enum for the given value, or undefined. */
export function parseEnum<K extends string, V extends number>(enumLike: EnumLike<K, V>, value: Optional<number>): V | undefined;

/** Returns the (number) value of the enum for the given string value (ignoring case), or the given defaultValue. */
export function parseEnum<K extends string, V extends number>(enumLike: EnumLike<K, V>, value: Optional<string>, defaultValue: V): V;

/** Returns the (number) value of the enum for the given value, or the given defaultValue. */
export function parseEnum<K extends string, V extends number>(enumLike: EnumLike<K, V>, value: Optional<number>, defaultValue: V): V;

export function parseEnum<K extends string, V extends number>(enumLike: EnumLike<K, V>, value?: Optional<string | number>, defaultValue?: V): V | undefined {
	if (isNullOrUndefined(value)) {
		return defaultValue;
	}

	if (typeof(value) === "number") {
		return Object.values(enumLike).find(val => val === value) as V ?? defaultValue;
	}

	const lower = String(value).toLowerCase();
	const enumKey = (Object.keys(enumLike) as K[]).find(key => key.toLowerCase() === lower && typeof(enumLike[key]) === "number");
	if (enumKey !== undefined) {
		return enumLike[enumKey] ?? defaultValue;
	}
	return defaultValue;
}
