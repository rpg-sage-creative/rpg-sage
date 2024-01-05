import XRegExp from "xregexp";
import type { Optional, OrNull, OrUndefined, TKeyValueArg, UUID } from "../..";
import { Collection } from "../ArrayUtils";
import { sortDescending } from "../ArrayUtils/Sort";
import { Color } from "../ColorUtils";
import { warn } from "../ConsoleUtils";
import { isKeyValueArg, parseKeyValueArg } from "../StringUtils";
import { isValid as isValidUuid } from "../UuidUtils";

type TArgIndexRet<T> = {
	arg: string;
	index: number;
	ret: T | null
};

type TArgAndIndex = TArgIndexRet<any>;

/** Represents an argument that was 'key=value'. If value is an empty string, it will be set as NULL. */
type TKeyValuePair<T extends string = string> = {
	/** The value on the left of the first equals sign. */
	key: string;
	/** This value is null if they value was an empty string. */
	value: T | null;
};

/** Used to enable simpler removal of key value pairs from the ArgsManager. */
type TKeyValueIndex<T extends string = string> = TKeyValuePair<T> & {
	index: number;
};

/** Parses the input/index to a key/value pair with the given index. */
function parseKeyValuePair<T extends string = string>(input: string, index: number): OrNull<TKeyValueIndex<T>> {
	const keyValueArg = parseKeyValueArg(input);
	if (keyValueArg) {
		const key = keyValueArg.key;
		const value = keyValueArg.value === "" ? null : <T>keyValueArg.value ?? null;
		return { key, value, index };
	}
	return null;
}

/** Returns true if the value starts with http:// or https:// and allows for <> brackets */
function isUrl(value: string): boolean {
	const regex = /^https?:\/\/|^<https?:\/\/.*?>$/i;
	return regex.test(value);
}

/** Removes any <> brackets from the given url. */
function cleanUrl(value: Optional<string>): Optional<string> {
	if (!value) {
		return value;
	}
	if (value.startsWith("<") && value.endsWith(">")) {
		return value.slice(1, -1).trim();
	}
	return value;
}

export default class ArgsManager<T extends string> extends Collection<T> {
	public constructor();
	public constructor(arrayLength: number);
	public constructor(...items: T[]);
	public constructor(...args: any[]) {
		super(...args);
		this.initialArgs = Array.from(this);
	}

	public initialArgs: T[];

	//#region key/value pairs

	// public forEachArg(callbackfn: (pair: TKeyValuePair, index: number, array: TKeyValuePair[]) => void, thisArg?: any): void {
	// 	const regex = XRegExp(`^([\\w\\pL\\pN]+)=(.*?)$`, "i");
	// 	this.args
	// 		.map(value => value.match(regex))
	// 		.filter(m => m)
	// 		.map(match => { return <TKeyValuePair>{ key:match[1], value:match[2] }; })
	// 		.forEach(callbackfn, thisArg);
	// }
	// public mapArg(callbackfn: (pair: TKeyValuePair, index: number, array: TKeyValuePair[]) => void, thisArg?: any): void {
	// 	const regex = XRegExp(`^([\\w\\pL\\pN]+)=(.*?)$`, "i");
	// 	this.args
	// 		.map(value => value.match(regex))
	// 		.filter(m => m)
	// 		.map(match => { return <TKeyValuePair>{ key:match[1], value:match[2] }; })
	// 		.forEach(callbackfn, thisArg);
	// }

	/** Maps each value to a key/value pair or null if the value isn't a key/value pair. */
	protected parseKeyValuePairs<U extends string = string>(): OrNull<TKeyValueIndex<U>>[] {
		return this.map(parseKeyValuePair) as TKeyValueIndex<U>[];
	}

	/** Returns all values that are key/value pairs, as a key/value pair. */
	public keyValuePairs<U extends string = string, V extends TKeyValuePair<U> = TKeyValuePair<U>>(): V[] {
		const pairs = this.parseKeyValuePairs<U>() as OrNull<V>[];
		return pairs.filter(kvp => kvp) as V[];
	}

	/** Removes and returns the key/value pair with a key that matches the given string or RegExp. */
	public removeKeyValuePair<U extends string = string>(key: string | RegExp): OrUndefined<TKeyValuePair<U>> {
		const regex = typeof(key) === "string" ? XRegExp(`^${key}$`, "i") : key;
		const keyValuePair = this.parseKeyValuePairs<U>().find(pair => pair?.key.match(regex));
		const index = keyValuePair?.index ?? -1;
		if (index > -1) {
			this.removeAt(index);
		}
		return keyValuePair as TKeyValuePair<U> ?? undefined;
	}

	//#endregion

	/** Removes the given arg/index from the args. */
	protected removeByArgAndIndex(...withIndexes: TArgAndIndex[]): void {
		withIndexes.sort((a, b) => sortDescending(a.index, b.index));
		withIndexes.forEach(withIndex => this.removeAt(withIndex.index));
	}

	//#region Key Args (anything with key=value)

	/**  */
	protected findKeyValueArgIndex(key: string): OrUndefined<TArgIndexRet<TKeyValueArg>> {
		return this.findArgIndexRet(arg => parseKeyValueArg(arg, key));
	}

	/** Returns the string value, null if the string is empty, or undefined if the key is not found. */
	protected removeByKey(key: string): Optional<string> {
		const withIndex = this.findKeyValueArgIndex(key);
		if (withIndex) {
			this.removeByArgAndIndex(withIndex);
			const value = withIndex.ret?.value;
			return value?.length ? value : null;
		}
		return undefined;
	}

	//#endregion

	//#region NonKey Args (anything that isn't key=value)

	/** Returns all value/index pairs that are not key/value "arg" pairs. */
	protected findArgIndexNonArgs(): TArgIndexRet<string>[] {
		return this
			.map((arg, index) => { return { arg:arg, index:index, ret:null }; })
			.filter(withIndex => !isKeyValueArg(withIndex.arg));
	}

	/** Removes and returns all args that are not key/value "arg" pairs. */
	protected removeAndReturnNonArgs(): TArgIndexRet<string>[] {
		const withIndexes = this.findArgIndexNonArgs();
		for (let index = withIndexes.length; index--;) {
			this.removeByArgAndIndex(withIndexes[index]);
		}
		return withIndexes;
	}

	//#endregion

	//#region Synchronous find

	/** Undefined if arg not found. */
	protected findArgIndexRet<U = any>(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): OrUndefined<TArgIndexRet<U>> {
		const length = this.length;
		for (let index = 0; index < length; index++) {
			const arg = this[index],
				ret = predicate.call(thisArg, arg, index, this) as U;
			if (ret) {
				return { arg:arg, index:index, ret:ret };
			}
		}
		return undefined;
	}

	/** Undefined if arg not found. */
	protected findArgIndexRetAndRemove<U = any>(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): OrUndefined<TArgIndexRet<U>> {
		const found = this.findArgIndexRet(predicate, thisArg);
		if (found) {
			this.removeByArgAndIndex(found);
		}
		return found;
	}

	/** Undefined if arg not found. */
	public findArg(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): OrUndefined<string> {
		return this.findArgIndexRet(predicate, thisArg)?.arg;
	}
	/** Null if arg found but no return value. Undefined if arg not found. */
	public findArgAndMap<U>(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): Optional<U> {
		return this.findArgIndexRet<U>(predicate, thisArg)?.ret;
	}
	/** Undefined if arg not found. */
	public findArgAndRemove(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): OrUndefined<string> {
		return this.findArgIndexRetAndRemove(predicate, thisArg)?.arg;
	}
	/** Null if arg found but no return value. Undefined if arg not found. */
	public findArgAndRemoveAndMap<U>(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): Optional<U> {
		return this.findArgIndexRetAndRemove<U>(predicate, thisArg)?.ret;
	}

	//#endregion

	//#region Asynchronous find

	/** Undefined if arg not found. */
	protected async asyncFindArgIndexRet<U>(predicate: (value: T, index: number, obj: T[]) => Promise<U>, thisArg?: any): Promise<OrUndefined<TArgIndexRet<U>>> {
		const length = this.length;
		for (let index = 0; index < length; index++) {
			const arg = this[index],
				promise = predicate.call(thisArg, arg, index, this) as Promise<any>,
				ret = await promise.catch(ex => warn(`Error calling a asyncFindWithIndex(predicate): ${ex}`));
			if (ret) {
				return { arg:arg, index:index, ret:ret };
			}
		}
		return undefined;
	}

	/** Undefined if arg not found. */
	protected async asyncFindArgIndexRetAndRemove<U>(predicate: (value: T, index: number, obj: T[]) => Promise<U>, thisArg?: any): Promise<OrUndefined<TArgIndexRet<U>>> {
		const found = await this.asyncFindArgIndexRet(predicate, thisArg);
		if (found) {
			this.removeByArgAndIndex(found);
		}
		return found;
	}

	/** Undefined if arg not found. */
	public async asyncFindArg(predicate: (value: T, index: number, obj: T[]) => Promise<unknown>, thisArg?: any): Promise<OrUndefined<string>> {
		return (await this.asyncFindArgIndexRet(predicate, thisArg))?.arg;
	}

	/** Null if arg found but no return value. Undefined if arg not found. */
	public async asyncFindArgAndMap<U>(predicate: (value: T, index: number, obj: T[]) => Promise<U>, thisArg?: any): Promise<Optional<U>> {
		return (await this.asyncFindArgIndexRet(predicate, thisArg))?.ret;
	}

	/** Undefined if arg not found. */
	public async asyncFindArgAndRemove(predicate: (value: T, index: number, obj: T[]) => Promise<unknown>, thisArg?: any): Promise<OrUndefined<string>> {
		return (await this.asyncFindArgIndexRetAndRemove(predicate, thisArg))?.arg;
	}

	/** Null if arg found but no return value. Undefined if arg not found. */
	public async asyncFindArgAndRemoveAndMap<U>(predicate: (value: T, index: number, obj: T[]) => Promise<U>, thisArg?: any): Promise<Optional<U>> {
		return (await this.asyncFindArgIndexRetAndRemove<U>(predicate, thisArg))?.ret;
	}

	//#endregion

	//#region remove and return objects/types

	/** Remove and return a Color object. */
	public removeAndReturnColor(): OrUndefined<Color> {
		const found = this.findArgAndRemove(Color.isValid);
		return found ? Color.from(found) : undefined;
	}

	/** Removes and returns a value from the given Enum. */
	public removeAndReturnEnum<U>(typeofEnum: any, ignoreCase = true): OrUndefined<U> {
		const caseFn = ignoreCase ? (s: string) => s.toLowerCase() : (s: string) => s,
			types = Object.keys(typeofEnum),
			casedTypes = types.map(caseFn),
			found = this.findArgAndRemove(arg => casedTypes.includes(caseFn(arg)));
		if (found) {
			const typesIndex = casedTypes.indexOf(caseFn(found)),
				type = types[typesIndex];
			return typeofEnum[type] as U;
		}
		return undefined;
	}

	/** Return undefined if no url is found.  */
	public removeAndReturnUrl(): OrUndefined<string>;
	/** Returns the string value, undefined if the key is not found or null if the string is empty, or undefined if the value is not a url. */
	public removeAndReturnUrl(key: string): Optional<string>;
	public removeAndReturnUrl(key?: string): Optional<string> {
		// if no key, then remove/return the first url
		if (!key) {
			return cleanUrl(this.findArgAndRemove(isUrl));
		}

		// get the value for the key
		const url = this.removeByKey(key);

		// if not found (undefined) or empty string (null), return null
		if (url === undefined || url === null) {
			return url;
		}

		// return a url or undefined
		return isUrl(url) ? cleanUrl(url) : undefined;
	}

	/** Removes and returns UUID. */
	public removeAndReturnUuid(): OrUndefined<UUID> {
		return this.findArgAndRemove(isValidUuid);
	}

	//#endregion

}
