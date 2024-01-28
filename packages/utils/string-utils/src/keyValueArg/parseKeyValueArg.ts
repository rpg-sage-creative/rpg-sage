import { dequote } from "../quote/dequote.js";
import { quote } from "../quote/quote.js";
import { KeyValueArg } from "./KeyValueArg.js";
import { isKeyValueArg } from "./isKeyValueArg.js";

/** Returns KeyValueArg if the input is a valid key/value pairing, null otherwise. */
export function parseKeyValueArg(input: string): KeyValueArg | null;

/** Returns KeyValueArg if the input is a valid key/value pairing that matches the given key, null otherwise. */
export function parseKeyValueArg(input: string, key: string): KeyValueArg | null;

export function parseKeyValueArg(input: string, key?: string): KeyValueArg | null {
	if (isKeyValueArg(input, key)) {
		const index = input.indexOf("=");
		// Because we are currently allowing spaces around the "=" character, we need to trim the raw key
		const key = input.slice(0, index).trim();
		const keyLower = key.toLowerCase();
		// Because we are currently allowing spaces around the "=" character, we need to trim the raw value
		const value = dequote(input.slice(index + 1).trim());
		const quoted = quote(value);
		const clean = `${keyLower}=${quoted}`;
		return { key, keyLower, value, clean };
	}
	return null;
}