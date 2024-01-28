import XRegExp from "xregexp";
import { KeyValueArg } from "./KeyValueArg.js";
import { getKeyValueArgSource } from "./getKeyValueArgSource.js";
import { parseKeyValueArg } from "./parseKeyValueArg.js";

export function parseKeyValueArgs(input: string): KeyValueArg[] {
	const regex = XRegExp(getKeyValueArgSource(), "g");
	const matches = regex.exec(input);
	const args = matches?.map(match => parseKeyValueArg(match)) ?? [];
	return args.filter(arg => arg) as KeyValueArg[];
}