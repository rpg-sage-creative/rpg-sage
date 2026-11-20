import { isNonNullEncodableObject } from "./internal/isNonNullEncodableObject.js";

/**
 * BigInt, Date, and non-finite-number friendly replacement for JSON.parse().
 * Restores the wrappers produced by encodeJson: { $undefined }, { $bigint }, { $date }, { $number } (NaN, -0, ±Infinity), { $map } of encoded key/value pairs, { $set } of encoded values, and { $ref:"key.path" }.
 * { $ref } paths are document-relative dot-notation locations resolved in a second pass over the finished tree, so forward references, ancestor references, and cycles all restore as real shared object references. The reviver runs during parsing and never sees a resolved reference.
 */
export function decodeJson<T = any>(text: string, reviver?: (this: any, key: string, value: any) => any): T {
	const decoded = decodeValue(text, reviver);

	// refs may point forward or at ancestors, so they can only be resolved once the whole document exists
	if (isNonNullEncodableObject(decoded) && text.includes("$ref")) {
		resolveRefs(decoded);
	}

	return decoded as T;
}

/**
 * Where the decoding work happens per value, via modified JSON.parse().
 * This function operates recursively.
 * Separate from decodeJson because references must be resolved afterwards.
 */
function decodeValue(text: string, reviver?: (this: any, key: string, value: any) => any): any {
	const decodedValue = JSON.parse(text, function(this: any, key: string, value: any) {
		value = decodeSpecialValue(value, reviver);

		if (reviver) {
			return reviver.call(this, key, value);
		}

		return value;
	});

	// { $undefined } cannot be restored inside the reviver — returning undefined from a reviver deletes object keys and nulls array slots — so wrappers are replaced by assignment after parsing, which preserves both
	if (isNonNullEncodableObject(decodedValue) && text.includes("$undefined")) {
		return restoreUndefined(decodedValue);
	}

	return decodedValue;
}

/** Provides a clean housing for decoding specially encoded objects. */
function decodeSpecialValue(value: any, reviver?: (this: any, key: string, value: any) => any): any {
	// JSON.parse hands raw nodes to the reviver, so value is only ever a plain object/array here — Dates/bigints/Maps/Sets are produced by this function and never re-enter it, so the full encodable check would be dead weight on the parse hot path
	if (value === null || typeof(value) !== "object") {
		return value;
	}

	// every wrapper is an object — arrays (including $map pair arrays and stunned entry strings' containers) can never match a branch, so skip all five payload probes
	if (Array.isArray(value)) {
		return value;
	}

	// our encodeJson converts a Date to { $date:"" }
	if (hasSingleKey(value, "$date")) {
		return new Date(value.$date);
	}

	// our encodeJson converts a bigint to { $bigint:"" }; make sure we don't have another object that happens to have $bigint:string as one of many keys
	if (hasSingleKey(value, "$bigint")) {
		return BigInt(value.$bigint);
	}

	// exact payload match so user data like { $number:"5" } is left alone
	if (hasSingleKey(value, "$number")) {
		const numberValue = value.$number;
		if (numberValue === "NaN") return NaN;
		else if (numberValue === "-0") return -0;
		else if (numberValue === "Infinity") return Infinity;
		else if (numberValue === "-Infinity") return -Infinity;
	}

	// our encodeJson converts Map objects to encoded key/value pair arrays — non-string entries are { $undefined } wrappers for function/symbol keys/values, restored by the post-parse walk below
	const mapValue = value.$map;
	if (Array.isArray(mapValue) && isSingleKey(value)) {
		return new Map(
			(mapValue as [string, string][]).map(([ key, value ]) => [
				typeof(key) === "string" ? decodeValue(key, reviver) : key,
				typeof(value) === "string" ? decodeValue(value, reviver) : value
			])
		);
	}

	// our encodeJson converts Set objects to encoded value arrays
	const setValue = value.$set;
	if (Array.isArray(setValue) && isSingleKey(value)) {
		return new Set(
			(setValue as string[]).map(value =>
				typeof(value) === "string" ? decodeValue(value, reviver) : value
			)
		);
	}

	// nothing to decode
	return value;
}

/**
 * Checks for exactly one own enumerable key with a string payload at the given name.
 * The typeof gate runs before isSingleKey's scan so plain nodes short-circuit without scanning, matching the memoized `??=` form it replaces; on raw parsed nodes a present key is always an own key, so a single-key object holding a payload at `key` has exactly that sole key.
 */
function hasSingleKey<T extends string>(value: any, key: T): value is Record<T, string> {
	return typeof(value[key]) === "string" && isSingleKey(value);
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
	return isNonNullEncodableObject(value)
		&& !Array.isArray(value)
		&& Object.keys(value).length === 1
		&& value.$undefined === "undefined";
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
		// own enumerable keys only, via for-in + hasOwnProperty — same no-allocation pattern as isSingleKey
		for (const key in value) {
			if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
			value[key] = restoreUndefined(value[key]);
		}
	}

	return value;
}

/** Matches encodeJson's exact single-key payload so user data like { $ref:"x", other:1 } is left alone — same guard style as the other wrappers. */
function getRefPath(value: any): string | undefined {
	if (!isNonNullEncodableObject(value)) {
		return undefined;
	}

	return hasSingleKey(value, "$ref")
		? value.$ref
		: undefined;
}

/**
 * Replaces every { $ref:"key.path" } wrapper produced by encodeJson with the object already decoded at that dot-notation location, restoring shared and circular references.
 * Ref sites are collected over the still-acyclic parsed tree and applied afterwards, so targets may be forward, ancestral, or inside Map/Set entries.
 * Unresolvable refs stay literal; a ref pointing at another ref resolves one step only.
 */
function resolveRefs(root: object): void {
	const sites: { path:string; replace:(target:any) => void; }[] = [];

	// pre-order walk tracking each node's ENCODED path — Map/Set entries live at "$map.i.k"/"$set.i" segments matching encodeJson's prefixes, not at decoded-collection keys
	const collect = (node: any, path: string): void => {
		if (Array.isArray(node)) {
			for (let i = 0; i < node.length; i++) {
				const child = node[i];
				const refPath = getRefPath(child);
				if (refPath !== undefined) {
					sites.push({
						path: refPath,
						replace: (target: any) => { node[i] = target; },
					});
				}else if (isNonNullEncodableObject(child)) {
					collect(child, path === "" ? String(i) : `${path}.${i}`);
				}
			}
			return;
		}

		if (node instanceof Map) {
			let index = 0;
			node.forEach((entryValue: any, entryKey: any) => {
				const basePath = `${path}.$map.${index++}`;

				const keyRef = getRefPath(entryKey);
				if (keyRef !== undefined) {
					sites.push({
						path: keyRef,
						replace: replaceMapSlot(node, index - 1, 0),
					});
				}else if (isNonNullEncodableObject(entryKey)) {
					collect(entryKey, `${basePath}.0`);
				}

				const valueRef = getRefPath(entryValue);
				if (valueRef !== undefined) {
					sites.push({
						path: valueRef,
						replace: replaceMapSlot(node, index - 1, 1),
					});
				}else if (isNonNullEncodableObject(entryValue)) {
					collect(entryValue, `${basePath}.1`);
				}
			});
			return;
		}

		if (node instanceof Set) {
			let index = 0;
			node.forEach((member: any) => {
				const refPath = getRefPath(member);
				if (refPath !== undefined) {
					sites.push({
						path: refPath,
						replace: replaceSetMember(node, index++)
					});
				}else if (isNonNullEncodableObject(member)) {
					collect(member, `${path}.$set.${index++}`);
				}
			});
			return;
		}

		// own enumerable keys only, via for-in + hasOwnProperty — same no-allocation pattern as isSingleKey; decoded nodes are plain objects so nothing inherited is visited
		for (const key in node) {
			if (!Object.prototype.hasOwnProperty.call(node, key)) continue;

			const child = node[key];
			const refPath = getRefPath(child);
			if (refPath !== undefined) {
				sites.push({
					path: refPath,
					replace: (target: any) => { node[key] = target; },
				});
			}else if (isNonNullEncodableObject(child)) {
				collect(child, path === "" ? key : `${path}.${key}`);
			}
		}
	};

	// Map/Set membership cannot be assigned in place without losing insertion order — snapshot the live entries, swap the slot, and refill; instances are never replaced, so nested collections stay connected
	const replaceMapSlot = (map: Map<any, any>, index: number, slot:0 | 1) => (target: any): void => {
		const entries:[any, any][] = [...map.entries()];
		entries[index] = slot === 0
			? [target, entries[index][1]]
			: [entries[index][0], target];
		map.clear();
		for (const [ key, value ] of entries) {
			map.set(key, value);
		}
	};

	const replaceSetMember = (set: Set<any>, index: number) => (target: any): void => {
		const values:any[] = [...set];
		values[index] = target;
		set.clear();
		for (const value of values) {
			set.add(value);
		}
	};

	const NOT_FOUND = Symbol("ref not found");

	// navigates the DECODED tree by ENCODED path: "$map"/"$set" segments step through Map/Set entries at their pre-decode positions
	const navigate = (refPath: string): any => {
		if (refPath === "") {
			return root;
		}

		let current: any = root;
		const keys = refPath.split(".");
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];

			if (current instanceof Map && key === "$map") {
				const index = Number(keys[++i]);
				const slot = keys[++i];
				if (!Number.isInteger(index) || (slot !== "0" && slot !== "1")) return NOT_FOUND;
				current = [...current.entries()][index]?.[slot === "0" ? 0 : 1];

			}else if (current instanceof Set && key === "$set") {
				const index = Number(keys[++i]);
				if (!Number.isInteger(index) || index < 0) {
					return NOT_FOUND;
				}
				current = [...current][index];

			// plain objects/arrays navigate by own key — a decoded Map/Set under a user-chosen "$map" key is only stepped through when the value IS one
			}else if (isNonNullEncodableObject(current) && Object.hasOwn(current, key)) {
				current = current[key];

			}else {
				return NOT_FOUND;
			}

			// encodeJson only ever tracks objects, so a defined-but-undefined hop means this path was never an encoder target
			if (current === undefined) {
				return NOT_FOUND;
			}
		}
		return current;
	};

	collect(root, "");

	for (const site of sites) {
		const target = navigate(site.path);
		if (target !== NOT_FOUND) {
			site.replace(target);
		}
	}
}

/** @deprecated use decodeJson() */
export const parseJson = decodeJson;
