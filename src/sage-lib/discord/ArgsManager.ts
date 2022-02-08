import utils, { isNullOrUndefined, TParsers } from "../../sage-utils";
import * as _XRegExp from "xregexp";
const XRegExp: typeof _XRegExp = (_XRegExp as any).default;

function cleanArg(content: string): string {
	const match = content.match(XRegExp(`^([\\w\\pL\\pN]+)\\s*=+\\s*("[^"]*"|\\S+)$`, "i"));
	if (match) {
		return `${match[1]}=${utils.StringUtils.dequote(match[2])}`;
	}
	return content;
}

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
			arg: XRegExp(`[\\w\\pL\\pN]+\\s*=+\\s*(?:"[^"]*"|\\S+)`, "i"),
			spaces: /\s+/,
			quotes: /"[^"]*"/,
			...additionalParsers
		};

		return utils.StringUtils.Tokenizer
			.tokenize(trimmed, parsers)
			.map(token => token.token.trim())
			.filter(token => token.length)
			.map(cleanArg)
			.map(s => utils.StringUtils.dequote(s))
			;
	}
}
