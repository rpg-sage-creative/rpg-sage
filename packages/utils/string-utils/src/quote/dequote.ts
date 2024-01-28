import { isQuoted } from "./isQuoted.js";

/** Removes first and last character if they are both quotes. */
export function dequote(value: string): string {
	return isQuoted(value) ? value.slice(1, -1) : value;
}