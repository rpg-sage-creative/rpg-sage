import { isNullOrUndefined, Optional, OrUndefined, TKeyValueArg, TParsers, VALID_UUID } from "../..";
import { Collection } from "../ArrayUtils";
import { exists } from "../ArrayUtils/Filters";
import { Color } from "../ColorUtils";
import { cleanUrl, isUrl } from "../HttpsUtils";
import type { ESCAPED_URL, VALID_URL } from "../HttpsUtils/types";
import { createKeyValueArgRegex, createQuotedRegex, createWhitespaceRegex, dequote, parseKeyValueArg, Tokenizer } from "../StringUtils";
import { isValid as isValidUuid } from "../UuidUtils";

/** Represents a key/value arg */
type TKeyedArg<T extends string = string> = TKeyValueArg<T>;

/** Represents a value only arg */
type TUnkeyedArg<T extends string = string> = {
	/** value (can have spaces) */
	value: T;
}

type TArg<T extends string = string> = TKeyedArg<T> | TUnkeyedArg<T>;

/** Represents an indexed TKeyedArg. */
type TKeyedIndexedArg<T extends string = string> = TKeyedArg<T> & {
	/** index */
	index: number;
}

/** Represents an indexed TKeyedArg. */
type TUnkeyedIndexedArg<T extends string = string> = TUnkeyedArg<T> & {
	/** index */
	index: number;
	key: never;
}

/** Represents an indexed TKeyedArg. key/keyLower/clean are undefined if the arg had no key. */
export type TIndexedArg<T extends string = string> = TKeyedIndexedArg<T> | TUnkeyedIndexedArg<T>;

export type TIndexedRetArg<T extends string = string, U = any> = TIndexedArg<T> & { ret:U; };

export default class ArgsManager<T extends string = string> extends Collection<TArg<T>> {

	public constructor(arrayLength: number);
	public constructor(...items: TArg<T>[]);
	public constructor(...args: (number | TArg<T>)[]) {
		super(...args.filter(exists) as TArg<T>[]);
	}

	//#region indexed, keyed, unkeyed, unkeyedValues

	/** Maps each value to a TIndexedKeyValueArg. */
	protected indexed<U extends TIndexedArg<T> = TIndexedArg<T>>(): Collection<U> {
		const collection = new Collection<U>();
		this.forEach((value, index) => collection.push({ index, ...value } as U));
		return collection;
	}

	/** Returns all indexed args that have keys. */
	public keyed<U extends string = T>(): Collection<TKeyedIndexedArg<U>> {
		return this.indexed<TKeyedIndexedArg<T>>().filter(arg => arg.key) as unknown as Collection<TKeyedIndexedArg<U>>;
	}

	/** Returns all indexed args that DO NOT have keys. */
	public unkeyed<U extends string = T>(): Collection<TUnkeyedIndexedArg<U>> {
		return this.indexed<TUnkeyedIndexedArg<T>>().filter(arg => !arg.key) as unknown as Collection<TUnkeyedIndexedArg<U>>;
	}

	/** Returns all the values of the unkeyed args. */
	public unkeyedValues<U extends string = T>(): Collection<U> {
		return this.unkeyed().map(arg => arg.value) as unknown as Collection<U>;
	}

	//#endregion

	//#region valueAt

	/** Returns the value for the arg at the given index. */
	public valueAt<U extends string = T>(index: number): U | undefined {
		return this[index]?.value as unknown as U;
	}

	//#endregion

	//#region Synchronous: findBy, findByKey, removeByKey, valueByKey

	/** Undefined if arg not found. */
	public findBy<U = any>(predicate: (arg: TIndexedArg<T>, index: number, args: TIndexedArg<T>[]) => unknown, thisArg?: any): OrUndefined<TIndexedRetArg<T, U>> {
		const args = this.indexed();
		for (const arg of args) {
			const ret = predicate.call(thisArg, arg, arg.index, args) as U;
			if (ret) {
				return { ret, ...arg };
			}
		};
		return undefined;
	}

	/** Returns the key/value pair with a key that matches the given string or RegExp. */
	public findByKey(key: string | RegExp): TIndexedArg<T> | undefined;
	/** Returns the key/value pair with a key and value that match the given string or RegExp values. */
	public findByKey(key: string | RegExp, value: string | RegExp): TIndexedArg<T> | undefined;
	public findByKey(key: string | RegExp, value?: string | RegExp): TIndexedArg<T> | undefined {
		const keyRegex = typeof(key) === "string" ? new RegExp(`^${key}$`, "i") : key;
		const valueRegex = value !== undefined ? typeof(value) === "string" ? new RegExp(`^${value}$`, "i") : value : undefined;
		const matcher = valueRegex
			? (arg: TKeyedIndexedArg<T>) => arg.key.match(keyRegex) && arg.value.match(valueRegex)
			: (arg: TKeyedIndexedArg<T>) => arg.key.match(keyRegex);
		return this.keyed().find(matcher);
	}

	protected findByKeyOrUnkeyed(key: OrUndefined<string>, unkeyed: OrUndefined<true>, tester: (value: string, unkeyed: boolean) => unknown): Optional<T>;
	protected findByKeyOrUnkeyed<U extends string>(key: OrUndefined<string>, unkeyed: OrUndefined<true>, tester: (value: string, unkeyed: boolean) => value is U): Optional<U>;
	protected findByKeyOrUnkeyed<U, V extends string>(key: OrUndefined<string>, unkeyed: OrUndefined<true>, tester: (value: string, unkeyed: boolean) => value is V, mapper?: (value: V) => U | null): Optional<U>;
	protected findByKeyOrUnkeyed<U, V extends string>(key: OrUndefined<string>, unkeyed: OrUndefined<true>, tester: (value: string, unkeyed: boolean) => value is V, mapper?: (value: V) => U | null): Optional<T | U> {
		if (this.isEmpty) {
			return undefined;
		}

		if (key) {
			const keyed = this.findByKey(key);
			if (keyed) {
				const value = keyed.value;
				if (tester(value, false)) {
					if (mapper) {
						return mapper(value);
					}
					return value === "" ? null : value;
				}
				return null;
			}

			// when key is given, we don't look for unkeyed unless explicitly told to
			if (!unkeyed) {
				return undefined;
			}
		}

		// no key given or unkeyed ==== true
		const values = this.unkeyedValues();
		for (const value of values) {
			if (tester(value, true)) {
				return mapper ? mapper(value) : value;
			}
		}

		return undefined;
	}

	/** Removes and returns the key/value pair with a key that matches the given string or RegExp. */
	public removeByKey(key: string | RegExp): OrUndefined<TKeyedArg<T>>;
	/** Removes and returns the key/value pair with a key and value that matche the given string or RegExp values. */
	public removeByKey(key: string | RegExp, value: string | RegExp): OrUndefined<TKeyedArg<T>>;
	public removeByKey(key: string | RegExp, value?: string | RegExp): OrUndefined<TKeyedArg<T>> {
		const arg = this.findByKey(key, value!);
		if (arg && arg.index > -1) {
			this.removeAt(arg.index);
			return arg as TKeyedArg<T>;
		}
		return undefined;
	}

	/**
	 * Returns the value of the key/value pair with a key that matches the given string or RegExp.
	 * Returns null if the value is an empty string.
	 * Returns undefined if the key is not found.
	 */
	public valueByKey(key: string | RegExp): Optional<T>;
	/**
	 * Returns the value of the key/value pair with a key and value that match the given string or RegExp values.
	 * Returns null if the value is an empty string.
	 * Returns undefined if the key is not found.
	 */
	public valueByKey(key: string | RegExp, value: string | RegExp): Optional<T>;
	public valueByKey(key: string | RegExp, value?: string | RegExp): Optional<T> {
		const found = this.findByKey(key, value!);
		if (found) {
			return found.value === "" ? null : found.value;
		}
		return undefined;
	}

	//#endregion

	//#region return objects/types

	//#region Color

	/**
	 * Returns the first unkeyed Color object.
	 * Returns undefined if none found.
	 */
	public findColor(): OrUndefined<Color>;
	/**
	 * Returns the Color object for the given key.
	 * Returns null if the value isn't a valid Color.
	 * Returns undefined if the key is not found.
	 */
	public findColor(key: string): Optional<Color>;
	/**
	 * Returns the Color object for the given key.
	 * Returns null if the value isn't a valid Color.
	 * If the key is not found, the first unkeyed Color object will be returned.
	 */
	public findColor(key: string, unkeyed: true): Optional<Color>;
	public findColor(key?: string, unkeyed?: true): Optional<Color> {
		return this.findByKeyOrUnkeyed(key, unkeyed, Color.isValid, Color.from);
	}

	//#endregion

	//#region Enum

	/**
	 * Returns the first unkeyed Enum value.
	 * Returns undefined if none found.
	 */
	public findEnum<U>(typeofEnum: any): OrUndefined<U>;
	/**
	 * Returns the Enum value for the given key.
	 * Returns null if the value isn't a valid Enum value.
	 * Returns undefined if the key is not found.
	 */
	public findEnum<U>(typeofEnum: any, key: string): Optional<U>;
	/**
	 * Returns the Enum value for the given key.
	 * Returns null if the value isn't a valid Enum value.
	 * If the key is not found, the first unkeyed Enum value will be returned.
	 */
	public findEnum<U>(typeofEnum: any, key: string, unkeyed: true): Optional<U>;
	public findEnum<U>(typeofEnum: any, key?: string, unkeyed?: true): Optional<U> {
		type KeyOfEnum = string & keyof typeof typeofEnum;
		type Tester = (value: string) => value is KeyOfEnum;
		const types = Object.keys(typeofEnum);
		const lowerTypes = types.map(s => s.toLowerCase());
		const isValidValue = (value: string) => lowerTypes.includes(value.toLowerCase());
		const toEnumValue = (value: string) => typeofEnum[types[lowerTypes.indexOf(value.toLowerCase())]] as U;
		return this.findByKeyOrUnkeyed(key, unkeyed, isValidValue as Tester, toEnumValue);
	}

	//#endregion

	//#region Uuid

	/**
	 * Returns the first unkeyed uuid.
	 * Returns undefined if none found.
	 */
	public findUuid(): OrUndefined<VALID_UUID>;
	/**
	 * Returns the uuid for the given key.
	 * Returns null if the value isn't a uuid.
	 * Returns undefined if the key is not found.
	 */
	public findUuid(key: string): Optional<VALID_UUID>;
	/**
	 * Returns the uuid for the given key.
	 * Returns null if the value isn't a uuid.
	 * If the key is not found, the first unkeyed Color object will be returned.
	 */
	public findUuid(key: string, unkeyed: true): Optional<VALID_UUID>;
	public findUuid(key?: string, unkeyed?: true): Optional<VALID_UUID> {
		return this.findByKeyOrUnkeyed<VALID_UUID>(key, unkeyed, isValidUuid);
	}

	public unkeyedUuids(): Collection<VALID_UUID> {
		return this.unkeyedValues<VALID_UUID>().filter(value => isValidUuid(value));
	}

	//#endregion

	//#region Url

	/**
	 * Returns the first unkeyed url.
	 * Returns undefined if none found.
	 */
	public findUrl(): OrUndefined<VALID_URL>;
	/**
	 * Returns the url for the given key.
	 * Returns null if the value isn't a url.
	 * Returns undefined if the key is not found.
	 */
	public findUrl(key: string): Optional<VALID_URL>;
	/**
	 * Returns the url for the given key.
	 * Returns null if the value isn't a url.
	 * If the key is not found, the first unkeyed Color object will be returned.
	 */
	public findUrl(key: string, unkeyed: true): Optional<VALID_URL>;
	public findUrl(key?: string, unkeyed?: true): Optional<VALID_URL> {
		return this.findByKeyOrUnkeyed(key, unkeyed, isUrl, cleanUrl);
	}

	public unkeyedUrls(): Collection<VALID_URL> {
		return this.unkeyedValues<VALID_URL | ESCAPED_URL>().filter(value => isUrl(value)).map(cleanUrl);
	}

	//#endregion

	//#endregion

	//#region static

	public static tokenize(content: string, additionalParsers: TParsers = {}): ArgsManager {
		if (isNullOrUndefined(content)) {
			return new ArgsManager();
		}

		if (typeof(content) !== "string") {
			return ArgsManager.from(content);
		}

		const trimmed = content.trim();
		if (!trimmed.length) {
			return new ArgsManager();
		}

		const parsers: TParsers = {
			arg: createKeyValueArgRegex(),
			spaces: createWhitespaceRegex(),
			quotes: createQuotedRegex(false),
			...additionalParsers
		};

		const tokenized = Tokenizer
			.tokenize(trimmed, parsers)
			.map(token => token.token.trim())
			.filter(token => token.length)
			.map(token => parseKeyValueArg(token) ?? { value:dequote(token) })
			;
		return ArgsManager.from(tokenized);
	}

	public static from<T extends string = string>(items: ArrayLike<T> | Iterable<T>): ArgsManager;
	public static from<T extends string = string>(items: ArrayLike<TArg<T>> | Iterable<TArg<T>>): ArgsManager;
	public static from<T extends string = string>(items: (T | TArg<T>)[]): ArgsManager {
		const array = Array.from(items);
		const mapped = array.map(item => typeof(item) === "string" ? { value:item } : item);
		return new ArgsManager(...mapped);
	}

	//#endregion
}
