import { TokenParsers, createKeyValueArgRegex, createQuotedRegex, createWhitespaceRegex, dequote, parseKeyValueArg, tokenize } from "@rsc-utils/string-utils";
import { isNullOrUndefined } from "@rsc-utils/type-utils";
import { ArgsManager as _ArgsManager } from "../../sage-utils/utils/ArgsUtils";

export default class ArgsManager extends _ArgsManager<string> {
	public constructor(private argsManagerInitialInput: string | ArrayLike<string> | Iterable<string>) {
		super(...ArgsManager.tokenize(argsManagerInitialInput));
	}

	public static from<T>(arrayLike: ArrayLike<T> | Iterable<T>): ArgsManager;
	public static from(other: ArgsManager): ArgsManager;
	public static from<T>(other: ArrayLike<T> | Iterable<T> | ArgsManager): ArgsManager {
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
			quotes: createQuotedRegex(true),
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
