import { encodeJson } from "./encodeJson.js";
import { prettifyJson } from "./prettifyJson.js";

/**
 * BigInt, Date, and non-finite-number friendly replacement for JSON.stringify().
 * Values JSON cannot represent are wrapped so decodeJson can restore them: bigint to { $bigint }, Date to { $date }, and NaN/-0/±Infinity to { $number }.
 * @deprecated use encodeJson() or prettifyJson(); this function now calls prettifyJson(value, maxLineLength) when maxLineLength is given, otherwise encodeJson(value, replacer, space).
 */
export function stringifyJson(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number, maxLineLength?: number): string;

export function stringifyJson(value: any, replacer?: (string | number)[] | null, space?: string | number, maxLineLength?: number): string;

export function stringifyJson(value: any, replacer?: Function | (string | number)[] | null, space?: string | number, maxLineLength = 0): string {
	return maxLineLength > 0
		? prettifyJson(value, maxLineLength, replacer, space)
		: encodeJson(value, replacer as never, space);
}
