import type { Optional } from "@rsc-utils/type-utils";
import { isBlank } from "./blank/isBlank.js";

/**
 * Capitalizes the first letter of the given string.
 * @param {T} value The string to be capitalized.
 */
export function capitalize<T extends string = string>(value: T): string;

/**
 * Capitalizes the first letter of the given string.
 * If null or undefined are passed, they are returned instead.
 * @param {Optional<T>} value The string to be capitalized or returned.
 */
export function capitalize<T extends string = string>(value: Optional<T>): Optional<string>;

/**
 * Capitalizes each substring (based on the given splitter).
 * @param {T} value The string to be capitalized.
 * @param {string | RegExp} splitter The way in which the string will be split.
 */
export function capitalize<T extends string = string>(value: T, splitter: string | RegExp): string;

/**
 * Capitalizes each substring (based on the given splitter).
 * If null or undefined are passed, they are returned instead.
 * @param {Optional<T>} value The string to be capitalized.
 * @param {string | RegExp} splitter The way in which the string will be split.
 */
export function capitalize<T extends string = string>(value: Optional<T>, splitter: string | RegExp): Optional<string>;

/**
 * Splits the string (using the splitter) before capitalizing each substring and rejoining then (using the joiner).
 * @param {T} value The string to be capitalized.
 * @param {string | RegExp} splitter The way in which the string will be split.
 * @param {string} joiner The string used to join the substrings back together.
 */
export function capitalize<T extends string = string>(value: T, splitter: string | RegExp, joiner: string): string;

/**
 * Capitalizes the first letter of the given string.
 * If a splitter is given, each substring will be capitalized.
 * If a joiner is given, it will be used to separate the subsections.
 */
export function capitalize(value: string, splitter: string | RegExp, joiner: string): string;

export function capitalize(value: Optional<string>, splitter?: string | RegExp, joiner?: string): Optional<string> {
	if (isBlank(value)) {
		return value;
	}
	if (splitter === null || splitter === undefined) {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
	return value
		.split(splitter)
		.map(s => capitalize(s))
		.join(joiner ?? (typeof(splitter) === "string" ? splitter : ""));
}
