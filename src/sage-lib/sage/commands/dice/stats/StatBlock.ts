import { dequote } from "@rsc-utils/core-utils";

/*
toLiteral(regex("i")`
	^
	(?<pcOrStat> pc | stat )?
	(?<alt> companion | hireling | alt | familiar )?
	$
`);
*/
const charTypeRegex = /^(?<pcOrStat>pc|stat)?(?<alt>companion|hireling|alt|familiar)?$/i;

/*
toLiteral(regex("i")`
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
`);
*/
const statBlockRegex = /(?<!(?:`))\{(?<charName>[\w\s]+|"[\w\s]+"):{2}(?<statKey>[^:\{\}]+)(?::(?<defaultValue>[^\{\}]+))?\}(?!(?:`))/i;

export function hasStatBlock(value: string): boolean {
	return statBlockRegex.test(value);
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
	const match = statBlockRegex.exec(value);
	if (!match) return undefined; //NOSONAR

	let [nameOrCharType, statKey, defaultValue] = match.slice(1);
	nameOrCharType = dequote(nameOrCharType).trim();
	statKey = statKey.trim();
	defaultValue = defaultValue?.trim();

	const stackValue = `${nameOrCharType}::${statKey}`.toLowerCase();

	const [charType, isPcType, isAltType] = charTypeRegex.exec(nameOrCharType) ?? [];
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
	return value.replace(statBlockRegex, match => {
		const statBlock = parseStatBlock(match.toString());
		let result: string | undefined;
		if (statBlock && !stack.includes(statBlock.stackValue)) {
			result = handler(statBlock);
		}
		return result ?? `\`${match}\``;
	});
}
