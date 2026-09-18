import type { EnumLike, OrUndefined } from "@rsc-utils/type-utils";
import { isDefined, parseEnum } from "@rsc-utils/type-utils";
import { dequote, isNotBlank, tokenize, type TokenParsers } from "../string/index.js";
import { QuotedContentRegExp } from "../string/quotes/QuotedContentRegExp.js";
import { WhitespaceRegExp } from "../whitespace/consts.js";
import { FlagArgRegExp, parseFlagArg } from "./parseFlagArg.js";
import { IncrementArgRegExp, parseIncrementArg } from "./parseIncrementArg.js";
import { KeyValueArgRegExp, parseKeyValueArg } from "./parseKeyValueArg.js";
import type { FlagArg, IncrementArg, KeyValueArg, ValueArg } from "./types.js";

type Arg<T extends string, U extends string> = FlagArg<T> | IncrementArg<T, U> | KeyValueArg<T, U> | ValueArg<T>;

function parseValueArg<T extends string>(raw: T, index: number): OrUndefined<ValueArg<T>> {
	if (isNotBlank(raw)) {
		const dequoted = dequote(raw);
		const value = dequoted === "" ? null : dequoted as T;
		return { raw, index, isValue:true, value }
	}
	return undefined;
}

/** Parses the input/index to ArgData. */
function parseArg<T extends string, U extends string>(arg: T, index: number): OrUndefined<Arg<T, U>> {
	return parseKeyValueArg<T, U>(arg, index)
		?? parseIncrementArg<T, U>(arg, index)
		?? parseFlagArg<T>(arg, index)
		?? parseValueArg<T>(arg, index);
}

export class ArgsManager<T extends string = string> {
	private _args: Arg<T, string>[];
	private _flagArgs?: FlagArg<T>[];
	private _incrementArgs?: IncrementArg<T, any>[];
	private _keyValueArgs?: KeyValueArg<T, any>[];
	private _strings: string[];
	private _valueArgs?: ValueArg<T>[];

	public constructor(raw?: string[]) {
		// store original input
		this._strings = raw?.slice() ?? [];
		// we do not want to include blank strings as args; they are separators
		this._args = raw?.filter(isNotBlank).map(parseArg) as Arg<T, any>[] ?? [];
	}

	// public [Symbol.]

	/** Returns the count of defined Args. This may differ from the count of the original (raw) string array. */
	public get length(): number {
		return this._args.length;
	}

	/** Returns an array of all the Args. */
	public args(): Arg<T, string>[] {
		return this._args.slice();
	}

	/** Sends all ValueArgs to parseEnum and returns only valid (defined) results. */
	public enumValues<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>): V[] {
		return this.valueArgs().map(arg => parseEnum<EnumLike<K, V>>(enumLike, arg.value)).filter(isDefined) as V[];
	}

	/** Returns KeyValueArg for the first key found. */
	public findKeyValueArg<U extends string = string>(key: Lowercase<string>, ...additionalKeys: Lowercase<string>[]): OrUndefined<KeyValueArg<T, U>>;
	public findKeyValueArg(...keys: Lowercase<string>[]): OrUndefined<KeyValueArg> {
		const keyValueArgs = this.keyValueArgs();
		for (const key of keys) {
			const arg = keyValueArgs.find(arg => arg.keyLower === key);
			if (arg) {
				return arg;
			}
		}
		return undefined;
	}

	/** Returns all FlagArg (.isFlag === true). */
	public flagArgs(): FlagArg<T>[] {
		this._flagArgs ??= this._args.filter(arg => arg.isFlag) as FlagArg<T>[];
		return this._flagArgs.slice();
	}

	/** Returns true if a flag is found that has any of the given keys. Flag keys are the flag with the first 1 or 2 dashes removed. */
	public hasFlag(key: Lowercase<string>, ...additionalKeys: Lowercase<string>[]): boolean;
	public hasFlag(...keys: Lowercase<string>[]): boolean {
		return this._args.some(arg => arg.isFlag && keys.includes(arg.keyLower));
	}

	/** Returns all IncrementArg (.isIncrement === true), optionally filtering by the given keys. */
	public incrementArgs<U extends string = string>(...keys: Lowercase<string>[]): IncrementArg<T, U>[] {
		this._incrementArgs ??= this._args.filter(arg => arg.isIncrement) as IncrementArg<T, U>[];
		if (keys.length && this._incrementArgs.length) {
			const lowers = keys.map(key => key.toLowerCase());
			return this._incrementArgs.filter(arg => lowers.includes(arg.keyLower));
		}
		return this._incrementArgs.slice();
	}

	/** Returns all KeyValueArg (.isKeyValue === true), optionally filtering by the given keys. */
	public keyValueArgs<U extends string = string>(...keys: Lowercase<string>[]): KeyValueArg<T, U>[] {
		this._keyValueArgs ??= this._args.filter(arg => arg.isKeyValue) as KeyValueArg<T, U>[];
		if (keys.length && this._keyValueArgs.length) {
			const lowers = keys.map(key => key.toLowerCase());
			return this._keyValueArgs.filter(arg => lowers.includes(arg.keyLower));
		}
		return this._keyValueArgs.slice();
	}

	/** Returns all args that are _NOT_ KeyValueArg objects. Used for convenient splitting of args into key/value or simply value. */
	public nonKeyValueArgs() {
		const keyValueArgs = this.keyValueArgs();
		return this._args.filter(arg => !keyValueArgs.includes(arg as KeyValueArg<T>));
	}

	/** Returns all args that are _NOT_ KeyValueArg objects. Used for convenient splitting of args into key/value or simply value. */
	public nonKeyValueStrings() {
		return this.nonKeyValueArgs().map(arg => arg.isValue ? arg.value : arg.raw);
	}

	/** Returns the original (raw) string array. */
	public raw(): string[] {
		return this._strings.slice();
	}

	/** Returns all ValueArg (.isValue === true). */
	public valueArgs(): ValueArg<T>[] {
		this._valueArgs ??= this._args.filter(arg => arg.isValue) as ValueArg<T>[];
		return this._valueArgs.slice();
	}

	/** Splits the given value into arguments by tokenizing it and then creating an ArgsManager from the resulting array. */
	public static from<T extends string = string>(value: string, additionalParsers?: TokenParsers): ArgsManager<T>;

	/** Creates an ArgsManager with a copy of the given values. */
	public static from<T extends string = string>(values: ArrayLike<string> | Iterable<string>): ArgsManager<T>;

	/** Creates a copy of the given ArgsManager. */
	public static from<T extends string = string>(other: ArgsManager<T>): ArgsManager<T>;

	public static from<T extends string = string>(content: string | ArrayLike<string> | Iterable<string> | ArgsManager<T>, additionalParsers: TokenParsers = {}): ArgsManager<T> {
		if (!content) {
			return new ArgsManager<T>();
		}

		if (typeof(content) !== "string") {
			const values = Array.from("args" in content ? content._strings : content);
			return new ArgsManager<T>(values);
		}

		const trimmed = content.trim();
		if (!trimmed.length) {
			return new ArgsManager<T>();
		}

		const parsers: TokenParsers = {
			flagArg: FlagArgRegExp,
			incrementArg: IncrementArgRegExp,
			keyValueArg: KeyValueArgRegExp,
			spaces: WhitespaceRegExp,
			quotes: QuotedContentRegExp,
			...additionalParsers
		};

		const raw = tokenize(trimmed, parsers).map(token => token.token);
		return new ArgsManager(raw);
	}

}
