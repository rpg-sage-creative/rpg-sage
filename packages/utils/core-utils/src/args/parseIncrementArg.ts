import { dequote } from "../string/index.js";
import { getIncrementArgRegex, type RegExpIncrementArgOptions } from "./getIncrementArgRegex.js";

export type IncrementArg<T extends string = string> = {
	/** key for the flag or pair */
	key: string;

	keyLower: string;

	/** how to increment/decrement */
	operator: "+" | "-";

	/** arg for ValueData, value for a PairData; null for pair with empty string, undefined for a flag */
	value: T;
};

export function parseIncrementArg<T extends string = string>(arg: string, options?: RegExpIncrementArgOptions): IncrementArg<T> | undefined {
	const regex = getIncrementArgRegex(options);
	const match = regex.exec(arg);
	if (match) {
		const [_, key, incrementer, modifier, value] = match;
		const keyLower = key.toLowerCase();
		if (incrementer) {
			return { key, keyLower, operator: incrementer[0] as "+", value: "1" as T };
		}
		return { key, keyLower, operator: modifier[0] as "+", value: dequote(value) as T };
	}
	return undefined;
}