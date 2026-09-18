import type { Optional } from "@rsc-utils/type-utils";
import { parseKeyValueArg } from "../../args/parseKeyValueArg.js";
import { KeyValueArgRegExpG } from "../../args/parseKeyValueArgs.js";
import type { RedactOptions } from "./RedactOptions.js";

export type RedactKeyValuePairsOptions = RedactOptions & {
	/** What character to use for redacted keys. */
	keyChar?: string;
	/** What character to use for redacted values. */
	valueChar?: string;
};

export function redactKeyValuePairs(content: string): string;
export function redactKeyValuePairs(content: string, redactedCharacter: string | undefined): string;
export function redactKeyValuePairs(content: string, options: RedactKeyValuePairsOptions): string;

export function redactKeyValuePairs(content: Optional<string>): Optional<string>;
export function redactKeyValuePairs(content: Optional<string>, redactedCharacter: string | undefined): Optional<string>;
export function redactKeyValuePairs(content: Optional<string>, options: RedactKeyValuePairsOptions): Optional<string>;

export function redactKeyValuePairs(content: Optional<string>, charOrOpts?: string | RedactKeyValuePairsOptions): Optional<string> {
	if (!content) return content;

	const { char = "*", complete, keyChar = char, punctuationChar = char, valueChar = char } = typeof(charOrOpts) === "string"
		? { char:charOrOpts }
		: charOrOpts ?? {};

	const [rEquals, rQuote] = complete ? "".padEnd(2, punctuationChar) : '="';

	return content.replace(KeyValueArgRegExpG, pair => {
		const { key, value, isNaked } = parseKeyValueArg(pair)!;
		const rKey = "".padEnd(key.length, keyChar);
		const rValue = "".padEnd(value?.length ?? 0, valueChar);
		if (isNaked) {
			return rKey + rEquals + rValue;
		}
		return rKey + rEquals + rQuote + rValue + rQuote;
	});
}