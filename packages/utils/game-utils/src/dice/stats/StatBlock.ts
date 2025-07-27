import { regex } from "regex";
import { unquote } from "../internal/unquote.js";

function createCharTypeRegex() {
	return regex("i")`
		^
		(?<pcOrStat> pc | stat )?
		(?<alt> companion | hireling | alt | familiar )?
		$
	`;
}

let charTypeRegex: RegExp;
function getCharTypeRegex(): RegExp {
	return charTypeRegex ?? (charTypeRegex = createCharTypeRegex());
}

function createStatBlockRegex() {
	return regex("i")`
		(?<!${"`"}) # no tick
		\{
			(?<charName> [\w\s]+ | "[\w\s]+" )
			:{2}
			(?<statKey> [^:\{\}]+ )
			(
				:
				(?<defaultValue> [^\{\}]+ )
			)?
		\}
		(?!${"`"}) # no tick
	`;
}

let statBlockRegex: RegExp;
function getStatBlockRegex(): RegExp {
	return statBlockRegex ?? (statBlockRegex = createStatBlockRegex());
}

export function hasStatBlock(value: string): boolean {
	return getStatBlockRegex().test(value);
}

type StatBlockResults = {
	charName?: string;
	charType?: string;
	isAltType?: boolean;
	isPcType?: boolean;
	statKey: string;
	stackValue: string;
	defaultValue?: string;
};

function parseStatBlock(value: string): StatBlockResults | undefined {
	const match = getStatBlockRegex().exec(value);
	if (!match) return undefined; //NOSONAR

	let [nameOrCharType, statKey, defaultValue] = match.slice(1);
	nameOrCharType = unquote(nameOrCharType).trim();
	statKey = statKey.trim();
	defaultValue = defaultValue?.trim();

	const stackValue = `${nameOrCharType}::${statKey}`.toLowerCase();

	const [charType, isPcType, isAltType] = getCharTypeRegex().exec(nameOrCharType) ?? [];
	const charName = charType ? undefined : nameOrCharType;
	return {
		charName,
		charType,
		defaultValue,
		isAltType: !!isAltType,
		isPcType: !!isPcType,
		stackValue,
		statKey,
	};
}

type ReplaceHandler = (block: StatBlockResults) => string | undefined;

/** Wraps the value.replace with logic that parses the stat block, checks for recursion, and returns tick blocked match when needed. */
export function replaceStatBlocks(value: string, handler: ReplaceHandler, stack: string[]): string {
	return value.replace(getStatBlockRegex(), match => {
		const statBlock = parseStatBlock(match.toString());
		let result: string | undefined;
		if (statBlock && !stack.includes(statBlock.stackValue)) {
			result = handler(statBlock);
		}
		return result ?? `\`${match}\``;
	});
}
