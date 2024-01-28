import XRegExp from "xregexp";
import { getKeyValueArgSource } from "./getKeyValueArgSource.js";

/** Returns true if the value is key=value or key="value" or key="", false otherwise. */
export function isKeyValueArg(value: string): boolean;

/** Returns true if the value is key=value or key="value" or key="" *AND* the key matches the given key, false otherwise. */
export function isKeyValueArg(value: string, key: string): boolean;

/** @internal */
export function isKeyValueArg(value: string, key?: string): boolean;

export function isKeyValueArg(value: string, key?: string): boolean {
	return XRegExp(`^${getKeyValueArgSource(key)}$`, "i").test(value);
}