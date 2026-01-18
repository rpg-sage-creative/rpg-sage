import { escapeRegex } from "@rsc-utils/core-utils";

type SuffixType = "alpha" | "number" | string[];

const alphaRegex = /(\s+(?<suffix>[A-Z]{1,2}))?$/;
const numberRegex = /(\s+\#(?<suffix>\d+))?$/;

type RegexAndMethod = { regex:RegExp; method:typeof nextNumeric|typeof nextNamed; suffixes?:string[]; };
function getRegexAndMethod(which: SuffixType = "number"): RegexAndMethod {
	if (which === "number") return { regex:numberRegex, method:nextNumeric };

	if (which === "alpha") return { regex:alphaRegex, method:nextNamed, suffixes:getAlphaList() };

	const escaped = which.map(value => escapeRegex(value));
	const regex = new RegExp(`(\\s+(?<suffix>${escaped.join("|")}))?$`);
	return { regex, method:nextNamed, suffixes:which.slice() };
}

function namesMatch(a: string, b: string, regex: RegExp): boolean {
	return a.replace(regex, "").toLowerCase() === b.replace(regex, "").toLowerCase();
}

function nextNumeric(names: string[]): string {
	let last = 0;
	names.forEach(name => {
		const { suffix } = numberRegex.exec(name)?.groups ?? { };
		const num = +(suffix ?? 0);
		last = Math.max(last, num);
	});
	return `#${last + 1}`;
}

function getAlphaList(): string[] {
	const aToZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
	const aToZZ = aToZ.slice();
	aToZ.forEach(left => aToZ.forEach(right => aToZZ.push(left + right)));
	return aToZZ;
}

function nextNamed(names: string[], regex: RegExp, suffixes: string[] = []): string | undefined {
	let last = -1;
	names.forEach(name => {
		const { suffix } = regex.exec(name)?.groups ?? { } as { suffix:string; };
		const index = suffixes.indexOf(suffix);
		// console.log({ suffix, index });
		last = Math.max(last, index);
	});
	return suffixes[last + 1];
}

type NameResolvable = string | { name:string; };
function resolveName(resolvable: NameResolvable): string {
	const name = typeof(resolvable) === "string" ? resolvable : resolvable.name;
	return name.trim();
}

type RenameResult = { suffix:string | undefined; replacer:Function; name:string; };
export function renameDuplicate(resolvable: NameResolvable, others: NameResolvable[], type?: SuffixType): RenameResult | undefined {
	const original = resolveName(resolvable);
	const names = others.map(resolveName);
	const { regex, method, suffixes } = getRegexAndMethod(type);

	const matches = names.filter(other => namesMatch(original, other, regex));
	if (matches.length) {
		const suffix = method(matches, regex, suffixes);
		const replacer = (name: string) => name.replace(regex, ` ${suffix}`);
		const name = replacer(original);
		return { suffix, replacer, name };
	}
	return undefined;
}