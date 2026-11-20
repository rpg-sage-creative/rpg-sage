import { isDate } from "node:util/types";
import { isNonNullEncodableObject } from "./internal/isNonNullEncodableObject.js";

// @todo look into this: https://github.com/moll/json-stringify-safe/blob/master/stringify.js

/**
 * BigInt, Date, and non-finite-number friendly replacement for JSON.stringify().
 * Values JSON cannot represent are wrapped so decodeJson can restore them:
 * - undefined to { $undefined }
 * - bigint to { $bigint }
 * - Date to { $date }
 * - NaN/-0/±Infinity to { $number }
 * - Map to { $map } of encoded key/value pairs
 * - Set to { $set } of encoded values.
 * Object references are tracked with their JSON key path (dot notation, ex: "key.path"), so every repeat of the same reference — circular or not — encodes as { $ref:"key.path" } pointing at its first occurrence instead of duplicating or throwing; the root value's path is "". Dates and boxed primitives serialize by value each time.
 */
export function encodeJson(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;

export function encodeJson(value: any, replacer?: (string | number)[] | null, space?: string | number): string;

export function encodeJson(value: any, replacer?: Function | (string | number)[] | null, space?: string | number): string {
	// JSON.stringify(undefined) === undefined; respect that at the root
	if (value === undefined) {
		return undefined as unknown as string;
	}
	return encodeValue(value, replacer, space);
}

/** Represents the data needed to track object references in a stack */
type StackItem = {
	/** the object after special encoding */
	encodedValue: object;
	/** json key path of the object */
	keyPath: string;
};

/**
 * Registers rawValue at its first key path so every later occurrence of the same reference encodes as { $ref }, circular or not.
 * Map/Set containers register themselves before their entries encode.
 * The encoded object is also pushed as a stack holder matched against the replacer's `this`, keeping descendant key paths accurate.
 */
function trackValue(
	keyPath: string,
	rawValue: any,
	encodedValue: any,
	stack: StackItem[],
	refPaths: Map<object, string>
): any {

	// we only want references to objects that keep their identity through a decode
	if (isNonNullEncodableObject(rawValue)) {

		// the first occurrence wins — later ones encode as { $ref } and must not redirect the pointer to themselves
		if (!refPaths.has(rawValue)) {
			refPaths.set(rawValue, keyPath);
		}
	}

	// add this keyPath to the stack for any object JSON.stringify will traverse
	if (isNonNullEncodableObject(encodedValue)) {
		stack.push({ encodedValue, keyPath });
	}

	return encodedValue;
}

/**
 * This does the actual encoding work via JSON.stringify().
 * This function operates recursively.
 * Separate from encodeJson because at the root level an undefined value returns undefined.
 */
function encodeValue(
	value: any,
	replacer?: Function | (string | number)[] | null,
	space?: string | number,
	refs = new Map<object, string>(), // <object, keyPath>
	pathPrefix = ""
): string {

	// objects currently being serialized by this JSON.stringify pass, innermost last
	const stack: StackItem[] = [];

	return JSON.stringify(value, function(this: any, key: string, value: any) {
		//#region stack work

		// pop finished nodes — the next call's holder is no longer nested under them; references stay registered so repeats anywhere encode as { $ref }
		while (stack.length) {
			const top = stack[stack.length - 1];

			// we are still top of the stack, leave it alone
			if (top.encodedValue === this) break;

			stack.pop();
		}

		const parentKeyPath = stack[stack.length - 1]?.keyPath ?? pathPrefix;

		const keyPath = key === ""
			? parentKeyPath
			: parentKeyPath === ""
				? key
				: `${parentKeyPath}.${key}`;

		const rawValue = this[key];

		//#endregion

		//#region encodeSpecialValue()

		// a reference we have already encoded somewhere else
		// — encode it as { $ref } pointing at its first occurrence instead of duplicating it (or throwing TypeError when circular)
		if (isNonNullEncodableObject(rawValue)) {
			const refPath = refs.get(rawValue);
			if (refPath !== undefined) {
				return trackValue(keyPath, rawValue, { $ref:refPath }, stack, refs);
			}
		}

		// keys with undefined values are lost, undefined values in arrays/maps/sets are lost
		if (rawValue === undefined) {
			return trackValue(keyPath, rawValue, { $undefined:"undefined" }, stack, refs);
		}

		// JSON.stringify(Date) returns number
		if (isDate(rawValue)) {
			return trackValue(keyPath, rawValue, { $date:rawValue.toISOString() }, stack, refs);
		}

		// JSON.stringify(bigint) throws Error
		if (typeof(rawValue) === "bigint") {
			return trackValue(keyPath, rawValue, { $bigint:rawValue.toString() }, stack, refs);
		}

		// NaN, ±Infinity, and -0 are lost
		if (typeof(rawValue) === "number") {
			if (!Number.isFinite(rawValue)) {
				return trackValue(keyPath, rawValue, { $number:String(rawValue) }, stack, refs);
			}
			if (Object.is(rawValue, -0)) {
				return trackValue(keyPath, rawValue, { $number:"-0" }, stack, refs);
			}
		}

		// Maps are stringified as {} — keys and values both pre-encode so decodeJson receives JSON strings on both sides (raw "stunned" is not valid JSON, and wrapper-object keys would be revived twice)
		if (rawValue instanceof Map) {
			// @TODO consider including $constructor as a way of finding a specific Map child class?
			// register before the entries encode so references inside them can point at this container; trackValue skips the redundant re-registration after
			refs.set(rawValue, keyPath);

			// forEach + counter instead of Array.from(entries()).map — one pass straight into the result array, no snapshot array and no intermediate [key, value] tuples to garbage collect
			const encodedEntries:[string, string][] = [];
			let index = 0;
			rawValue.forEach((entryValue:any, entryKey:any) => {
				encodedEntries.push([
					encodeValue(entryKey, replacer as never, space, refs, `${keyPath}.$map.${index}.0`),
					encodeValue(entryValue, replacer as never, space, refs, `${keyPath}.$map.${index}.1`)
				]);
				index++;
			});

			return trackValue(keyPath, rawValue, { $map:encodedEntries }, stack, refs);
		}

		// Sets are stringified as {}
		if (rawValue instanceof Set) {
			// @TODO consider including $constructor as a way of finding a specific Set child class?
			refs.set(rawValue, keyPath);
			const encodedValues:string[] = [];
			let index = 0;
			rawValue.forEach((entryValue:any) => {
				encodedValues.push(encodeValue(entryValue, replacer as never, space, refs, `${keyPath}.$set.${index++}`));
			});
			return trackValue(keyPath, rawValue, { $set:encodedValues }, stack, refs);
		}

		//#endregion

		// if they passed in a replacer, then let's use it
		if (replacer) {
			// call a function
			if (typeof(replacer) === "function") {
				return trackValue(keyPath, rawValue, replacer.call(this, key, value), stack, refs);

			// check an array to ensure the key was given
			// key "" is JSON.stringify's sentinel for the root value, which must never be filtered out
			}else if (Array.isArray(replacer) && key !== "" && !replacer.some(_key => String(_key) === key)) {
				return undefined;
			}
		}

		return trackValue(keyPath, rawValue, value, stack, refs);
	}, space);
}
