import { Collection } from "@rsc-utils/array-utils";
import { type OrNull, type OrUndefined } from "@rsc-utils/core-utils";
import { isKeyValueArg, parseKeyValueArg, type KeyValueArg } from "@rsc-utils/string-utils";

type TArgIndexRet<T> = {
	arg: string;
	index: number;
	ret: T | null
};

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

export class ArgsManager<T extends string> extends Collection<T> {
	public constructor();
	public constructor(arrayLength: number);
	public constructor(...items: T[]);
	public constructor(...args: any[]) {
		super(...args);
		this.initialArgs = Array.from(this);
	}

	public initialArgs: T[];

	//#region key/value pairs

	/** Maps each value to a key/value pair or null if the value isn't a key/value pair. */
	protected parseKeyValuePairs<U extends string = string>(): OrNull<TKeyValueIndex<U>>[] {
		return this.map(parseKeyValuePair) as TKeyValueIndex<U>[];
	}

	/** Returns all values that are key/value pairs, as a key/value pair. */
	public keyValuePairs<U extends string = string, V extends TKeyValuePair<U> = TKeyValuePair<U>>(): V[] {
		const pairs = this.parseKeyValuePairs<U>() as OrNull<V>[];
		return pairs.filter(kvp => kvp) as V[];
	}

	//#endregion

	//#region Key Args (anything with key=value)

	/**  */
	protected findKeyValueArgIndex(key: string): OrUndefined<TArgIndexRet<KeyValueArg>> {
		return this.findArgIndexRet(arg => parseKeyValueArg(arg, key));
	}

	//#endregion

	//#region NonKey Args (anything that isn't key=value)

	/** Returns all value/index pairs that are not key/value "arg" pairs. */
	protected findArgIndexNonArgs(): TArgIndexRet<string>[] {
		return this
			.map((arg, index) => { return { arg:arg, index:index, ret:null }; })
			.filter(withIndex => !isKeyValueArg(withIndex.arg));
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

	//#endregion

}
