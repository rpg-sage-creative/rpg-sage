import { isNullOrUndefined } from "@rsc-utils/type-utils";
import utils, { type TParsers } from "../../sage-utils";

export default class ArgsManager extends utils.ArgsUtils.ArgsManager<string> {
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

	public static tokenize(content: string | ArrayLike<string> | Iterable<string>, additionalParsers: TParsers = {}): string[] {
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

		const parsers: TParsers = {
			arg: utils.StringUtils.createKeyValueArgRegex(),
			spaces: utils.StringUtils.createWhitespaceRegex(),
			quotes: utils.StringUtils.createQuotedRegex(true),
			...additionalParsers
		};

		return utils.StringUtils.Tokenizer
			.tokenize(trimmed, parsers)
			.map(token => token.token.trim())
			.filter(token => token.length)
			.map(token => utils.StringUtils.parseKeyValueArg(token)?.clean ?? token)
			.map(s => utils.StringUtils.dequote(s))
			;
	}
}
