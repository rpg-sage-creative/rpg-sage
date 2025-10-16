import { AllCodeBlocksRegExp, numberOrUndefined, tokenize } from "@rsc-utils/core-utils";

const SortTagRegExp = /<sort(\s[^\>]+)?\s*>((?:(?<!<sort)(?:.|\n))*?)<\/sort>/i;
// const SortTagRegExpG = /<sort(\s[^\>]+)?\s*>((.|\n)*?)<\/sort>/gi;
// const LineParseRegExp = regex()`
// 	^
// 	(?<num>
// 		\g<number>
// 		|
// 		\|\| \s* \g<number> \s* \|\|
// 	)
// 	\s+
// 	(?<val>
// 		.*?
// 	)
// 	$

// 	(?(DEFINE)
// 		(?<number> [\-\+−]? \d+ (\.\d+)? )
// 	)
// `;
const LineParseRegExp = /^(?<num>(?:[\-\+−]?\d+(?:\.\d+)?)|\|\|\s*(?:[\-\+−]?\d+(?:\.\d+)?)\s*\|\|)\s+(?<val>.*?)$/v;
const HtmlTagRegExpG = /<\/?\w+[^>]*>/g;
const TopRegExp = /top="(\d+)"|top=(\d+)/;

type Line = { line:string; num?:number; spoiler?:boolean; val?:string; };
function parseSortLine(line: string, hideNumbers?: boolean): Line | undefined {
	// trim line just in case
	line = line.trim();

	// no line, nothing to do
	if (!line) return undefined;

	// inline dice use <b> and <i> for formatting
	line = line.replace(HtmlTagRegExpG, "");

	// run regex
	const groups = LineParseRegExp.exec(line)?.groups;
	if (groups) {
		// get num and val as strings
		let { num, val } = groups;

		// check for spoiler
		const spoiler = num.startsWith("||");

		// slice num if spoiler
		if (spoiler) num = num.slice(2, -2).trim();

		// correct a mathematical minus character
		if (num.startsWith("−")) num = "-" + num.slice(1);

		// return the sort data and updated line
		return {
			line: hideNumbers ? val : `${spoiler ? "?" : num} ${val}`,
			num: +num,
			spoiler,
			val
		};
	}

	// return just the line
	return { line };
}

function sortLineSorter(a: Line, b: Line, one: 1 | -1): number {
	// ensure unsorted lines are always at the top
	if (a.num === undefined) return -1;
	else if (b.num === undefined) return 1;

	// sort by number
	if (a.num < b.num) return one;
	else if (a.num > b.num) return -one;

	// sort by val if same number
	if (a.val! < b.val!) return one;
	if (a.val! > b.val!) return -one;

	// sort by line as fallback
	if (a.line < b.line) return one;
	if (a.line > b.line) return -one;

	return 0;
}

function process(content: string): string {
	let match: RegExpExecArray | null;
	while (match = SortTagRegExp.exec(content)) {
		const [_, attr, inner] = match;

		// default sort is descending; ascMultiplier reverses the sort order
		let ascMultiplier: 1 | -1 = 1;
		let hideNumbers = false;
		let top: number | undefined;
		if (attr) {
			const attrLower = attr.toLowerCase();
			hideNumbers = attrLower.includes("hide");
			ascMultiplier = attrLower.includes("asc") ? -1 : 1;
			top = numberOrUndefined(TopRegExp.exec(attrLower)?.slice(1, 3).find(val => val));
		}

		// parse the lines
		const lines = inner.split("\n")
			.map(line => parseSortLine(line, hideNumbers))
			.filter((line?: Line): line is Line => !!line);

		// sort the lines
		lines.sort((a, b) => sortLineSorter(a, b, ascMultiplier));

		const replacement = lines.slice(0, top).map(({ line }) => line).join("\n");

		content = content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
	}
	return content;
}

export function processSortTag(content: string): string {
	if (!content) return "";

	return tokenize(content, { codeBlock:AllCodeBlocksRegExp }).map(({ key, token }) => {
		return key === "codeBlock" ? token : process(token);
	}).join("");
}