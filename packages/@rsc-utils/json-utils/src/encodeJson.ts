import { isDate } from "node:util/types";

// @todo look into this: https://github.com/moll/json-stringify-safe/blob/master/stringify.js

/**
 * BigInt, Date, and non-finite-number friendly replacement for JSON.stringify().
 * Values JSON cannot represent are wrapped so decodeJson can restore them: undefined to { $undefined }, bigint to { $bigint }, Date to { $date }, NaN/-0/±Infinity to { $number }, Map to { $map } of encoded key/value pairs, and Set to { $set } of encoded values.
 */
export function encodeJson(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;

export function encodeJson(value: any, replacer?: (string | number)[] | null, space?: string | number): string;

export function encodeJson(value: any, replacer?: Function | (string | number)[] | null, space?: string | number): string {
	if (value === undefined) return undefined as unknown as string;
	return _encodeJson(value, replacer, space);
}


export function _encodeJson(value: any, replacer?: Function | (string | number)[] | null, space?: string | number): string {
	return JSON.stringify(value, function(this: any, key: string, value: any) {
		const cleanValue = this[key];

		// keys with undefined values are lost, undefined values in arrays/maps/sets are lost
		if (cleanValue === undefined) {
			return { $undefined:"undefined" };
		}

		// JSON.stringify(Date) returns number
		if (isDate(cleanValue)) {
			return { $date:cleanValue.toISOString() };
		}

		// JSON.stringify(bigint) throws Error
		if (typeof(cleanValue) === "bigint") {
			return { $bigint:cleanValue.toString() };
		}

		// NaN, ±Infinity, and -0 are lost
		if (typeof(cleanValue) === "number") {
			if (!Number.isFinite(cleanValue)) {
				return { $number:String(cleanValue) };
			}
			if (Object.is(cleanValue, -0)) {
				return { $number:"-0" };
			}
		}

		// Maps are stringified as {} — keys and values both pre-encode so decodeJson receives JSON strings on both sides (raw "stunned" is not valid JSON, and wrapper-object keys would be revived twice)
		if (cleanValue instanceof Map) {
			// @TODO consider including $constructor as a way of finding a specific Map child class?
			return {
				$map: Array.from(cleanValue.entries()).map(([ key, value ]) => [_encodeJson(key, replacer as never, space), _encodeJson(value, replacer as never, space)])
			};
		}

		// Sets are stringified as {}
		if (cleanValue instanceof Set) {
			// @TODO consider including $constructor as a way of finding a specific Set child class?
			return {
				$set: Array.from(cleanValue.values()).map(value => _encodeJson(value, replacer as never, space))
			};
		}

		// if they passed in a replacer, then let's use it
		if (replacer) {
			// call a function
			if (typeof(replacer) === "function") {
				return replacer.call(this, key, value);

			// check an array to ensure the key was given
			// key "" is JSON.stringify's sentinel for the root value, which must never be filtered out
			}else if (Array.isArray(replacer) && key !== "" && !replacer.some(_key => String(_key) === key)) {
				return undefined;
			}
		}

		return value;
	}, space);
}
