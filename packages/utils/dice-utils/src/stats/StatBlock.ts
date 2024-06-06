import XRegExp from "xregexp";
import { unquote } from "../internal/unquote.js";

function createCharTypeRegex() {
	return XRegExp(`
		^
		(pc|stat)?
		(companion|hireling|alt|familiar)?
		$
	`, "xi");
}

let charTypeRegex: RegExp;
function getCharTypeRegex(): RegExp {
	return charTypeRegex ?? (charTypeRegex = createCharTypeRegex());
}

function createStatBlockRegex() {
	return XRegExp(`
		# no tick
		(?<!\`)

		\\{
			# char name or quoted char name
			(
				[\\w ]+    # <-- should we drop this space?
				|          # <-- in other places we allow alias (no spaces) or "quoted name with spaces"
				"[\\w ]+"
			)

			# separator
			:{2}

			# stat key
			(
				[^:{}]+
			)

			# default value
			(?:
				:
				([^{}]+)
			)?
		\\}

		# no tick
		(?!\`)
	`, `xi`);
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
	const match = XRegExp.exec(value, getStatBlockRegex());
	if (!match) return undefined; //NOSONAR

	let [nameOrCharType, statKey, defaultValue] = match.slice(1);
	nameOrCharType = unquote(nameOrCharType).trim();
	statKey = statKey.trim();
	defaultValue = defaultValue?.trim();

	const stackValue = `${nameOrCharType}::${statKey}`.toLowerCase();

	const [charType, isPcType, isAltType] = XRegExp.exec(nameOrCharType, getCharTypeRegex()) ?? [];
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

type ReplaceHandler = (block: StatBlockResults) => string | null;

/** Wraps the value.replace with logic that parses the stat block, checks for recursion, and returns tick blocked match when needed. */
export function replaceStatBlocks(value: string, handler: ReplaceHandler, stack: string[]): string {
	return XRegExp.replace(value, getStatBlockRegex(), match => {
		const statBlock = parseStatBlock(match.toString());
		let result: string | null = null;
		if (statBlock && !stack.includes(statBlock.stackValue)) {
			result = handler(statBlock);
		}
		return result ?? `\`${match}\``;
	}, "all");
}
