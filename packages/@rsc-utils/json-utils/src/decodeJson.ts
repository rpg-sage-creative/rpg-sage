/**
 * BigInt, Date, and non-finite-number friendly replacement for JSON.parse().
 * Restores the wrappers produced by encodeJson: { $undefined }, { $bigint }, { $date }, { $number } (NaN, -0, ±Infinity), { $map } of encoded key/value pairs, and { $set } of encoded values.
 */
export function decodeJson<T = any>(text: string, reviver?: (this: any, key: string, value: any) => any): T {
	const parsed = JSON.parse(text, function(this: any, key: string, value: any) {
		// process specially encoded values
		value = _decode(value, reviver);

		if (reviver) return reviver.call(this, key, value);
		return value;
	});

	// { $undefined } cannot be restored inside the reviver — returning undefined from a reviver deletes object keys and nulls array slots — so wrappers are replaced by assignment after parsing, which preserves both
	if (typeof(parsed) === "object" && parsed !== null && text.includes("$undefined")) {
		return restoreUndefined(parsed) as T;
	}

	return parsed;
}

/** Provides a clean housing for decoding specially encoded objects. */
function _decode(value: any, reviver?: (this: any, key: string, value: any) => any): any {
	if (value === null || typeof(value) !== "object") return value;

	let isSingle: boolean | undefined;

	// our encodeJson converts a Date to { $date:"" }
	const dateValue = value.$date;
	if (typeof(dateValue) === "string" && (isSingle ??= isSingleKey(value))) {
		return new Date(dateValue);
	}

	// our encodeJson converts a bigint to { $bigint:"" }; make sure we don't have another object that happens to have $bigint:string as one of many keys
	const bigintValue = value.$bigint;
	if (typeof(bigintValue) === "string" && (isSingle ??= isSingleKey(value))) {
		return BigInt(bigintValue);
	}

	// exact payload match so user data like { $number:"5" } is left alone
	const numberValue = value.$number;
	if (typeof(numberValue) === "string" && (isSingle ??= isSingleKey(value))) {
		if (numberValue === "NaN") return NaN;
		else if (numberValue === "-0") return -0;
		else if (numberValue === "Infinity") return Infinity;
		else if (numberValue === "-Infinity") return -Infinity;
	}

	// our encodeJson converts Map objects to encoded key/value pair arrays — non-string entries are { $undefined } wrappers for function/symbol keys/values, restored by the post-parse walk below
	const mapValue = value.$map;
	if (Array.isArray(mapValue) && (isSingle ??= isSingleKey(value))) {
		return new Map(
			(mapValue as [string, string][]).map(([ key, value ]) => [
				typeof(key) === "string" ? decodeJson(key, reviver) : key,
				typeof(value) === "string" ? decodeJson(value, reviver) : value
			])
		);
	}

	// our encodeJson converts Set objects to encoded value arrays
	const setValue = value.$set;
	if (Array.isArray(setValue) && (isSingle ??= isSingleKey(value))) {
		return new Set(
			(setValue as string[]).map(value =>
				typeof(value) === "string" ? decodeJson(value, reviver) : value
			)
		);
	}

	return value;
}

/**
 * Checks for exactly one own enumerable key without allocating the array that Object.keys() would build on every object node.
 */
function isSingleKey(value: object): boolean {
	let count = 0;
	for (const key in value) {
		if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
		if (++count > 1) return false;
	}
	return count === 1;
}

function isUndefinedWrapper(value: any): boolean {
	return typeof(value) === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 1 && value.$undefined === "undefined";
}

/**
 * Replaces every { $undefined:"undefined" } wrapper with the actual undefined value, at any depth and inside Maps/Sets.
 * Assignment (not reviver returns) is what keeps undefined-valued object keys present and array slots defined.
 */
function restoreUndefined(value: any): any {
	if (isUndefinedWrapper(value)) return undefined;

	if (Array.isArray(value)) {
		for (let i = 0, length = value.length; i < length; i++) {
			value[i] = restoreUndefined(value[i]);
		}
		return value;
	}

	if (value instanceof Map) {
		const entries: [any, any][] = [];
		value.forEach((entryValue, entryKey) => entries.push([restoreUndefined(entryKey), restoreUndefined(entryValue)]));
		return new Map(entries);
	}

	if (value instanceof Set) {
		const values: any[] = [];
		value.forEach(entryValue => values.push(restoreUndefined(entryValue)));
		return new Set(values);
	}

	if (typeof(value) === "object" && value !== null) {
		for (const key of Object.keys(value)) {
			value[key] = restoreUndefined(value[key]);
		}
	}

	return value;
}

/** @deprecated use decodeJson() */
export const parseJson = decodeJson;