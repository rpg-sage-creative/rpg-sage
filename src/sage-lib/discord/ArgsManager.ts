import { ArgsManager as _ArgsManager } from "@rsc-utils/args-utils";
import { type OrUndefined, isNullOrUndefined } from "@rsc-utils/core-utils";
import { type KeyValueArg, type TokenParsers, createKeyValueArgRegex, createQuotedRegex, createWhitespaceRegex, dequote, parseKeyValueArg, tokenize } from "@rsc-utils/string-utils";

type TArgIndexRet<T> = {
	arg: string;
	index: number;
	ret: T | null
};

export class ArgsManager<T extends string = string> extends _ArgsManager<T> {
	public constructor(private argsManagerInitialInput: string | ArrayLike<string> | Iterable<string>) {
		super(...ArgsManager.tokenize(argsManagerInitialInput) as T[]);
	}

	//#region overrides to make things public ahead of rewrite
	public findArgIndexNonArgs(): TArgIndexRet<string>[] {
		return super.findArgIndexNonArgs();
	}
	public findKeyValueArgIndex(key: string): OrUndefined<TArgIndexRet<KeyValueArg>> {
		return super.findKeyValueArgIndex(key);
	}
	//#endregion

	public static from<T extends string = string>(arrayLike: ArrayLike<T> | Iterable<T>): ArgsManager<T>;
	public static from(other: ArgsManager<string>): ArgsManager<string>;
	public static from<T extends string = string>(other: ArrayLike<T> | Iterable<T> | ArgsManager): ArgsManager {
		// TODO: Decide if I really want to recreate it from scratch after I might have removed values for a reason ...
		if (other && "argsManagerInitialInput" in other) {
			return new ArgsManager(other.argsManagerInitialInput);
		}
		return new ArgsManager(other as string[] ?? []);
	}

	public static tokenize(content: string | ArrayLike<string> | Iterable<string>, additionalParsers: TokenParsers = {}): string[] {
		if (isNullOrUndefined(content)) {
			return [];
		}
		if (typeof(content) !== "string") {
			return Array.from(content);
		}

		const trimmed = content.trim();
		if (!trimmed.length) {
			return [];
		}

		const parsers: TokenParsers = {
			arg: createKeyValueArgRegex(),
			spaces: createWhitespaceRegex(),
			quotes: createQuotedRegex({lengthQuantifier:"*"}),
			...additionalParsers
		};

		return tokenize(trimmed, parsers)
			.map(token => token.token.trim())
			.filter(token => token.length)
			.map(token => parseKeyValueArg(token)?.clean ?? token)
			.map(dequote)
			;
	}
}
