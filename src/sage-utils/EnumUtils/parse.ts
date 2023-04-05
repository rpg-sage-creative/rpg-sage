import { getKeys } from "./getKeys";
import { getValues } from "./getValues";

/** Represents a TypeScript enum object. */
export type EnumLike<K extends string = string, V extends number = number> = Record<K, V>;

/**
 * Compares the given value to the keys of the given enum object.
 * @param {EnumLike} enumLike The enum to parse.
 * @param {string} key The key to find.
 * @returns {V | undefined} A number that represents a value of the enum, or undefined if not found.
 */
export function parse<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, key: string): V | undefined;

/**
 * Compares the given value to the values of the given enum object.
 * @param {EnumLike} enumLike The enum to parse.
 * @param {number} value The value to find.
 * @returns {V | undefined} A number that represents a value of the enum, or undefined if not found.
 */
export function parse<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, value: number): V | undefined;

/**
 * Compares the given value to the keys of the given enum object.
 * @param {EnumLike} enumLike The enum to parse.
 * @param {string} key The key to find.
 * @returns {V} A number that represents a value of the enum, if found, or the given defaultValue otherwise.
 */
export function parse<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, key: string, defaultValue: V): V;

/**
 * Compares the given value to the values of the given enum object.
 * @param {EnumLike} enumLike The enum to parse.
 * @param {number} value The value to find.
 * @returns {V} A number that represents a value of the enum, if found, or the given defaultValue otherwise.
 */
export function parse<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, value: number, defaultValue: V): V;

export function parse<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, value: string | number, defaultValue?: V): V | undefined {
	if (typeof(value) === "number") {
		return getValues(enumLike).find(val => val === value) as V ?? defaultValue;
	}

	const lower = String(value).toLowerCase();
	const enumKey = getKeys(enumLike).find(key => key.toLowerCase() === lower);
	if (enumKey !== undefined) {
		return enumLike[enumKey] ?? defaultValue;
	}
	return defaultValue;
}
