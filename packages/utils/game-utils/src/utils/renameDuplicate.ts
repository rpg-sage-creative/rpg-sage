import { escapeRegex } from "@rsc-utils/core-utils";

type SuffixType = "alpha" | "number" | string[];

const alphaRegex = /(\s+(?<suffix>[A-Z]{1,2}))?$/;
const numberRegex = /(\s+\#(?<suffix>\d+))?$/;

function getRegexAndMethod(which: SuffixType = "number") {
	if (which === "number") return { regex:numberRegex, method:nextNumeric };

	if (which === "alpha") return { regex:alphaRegex, method:nextNamed, suffixes:getAlphaList() };

	const escaped = which.map(value => escapeRegex(value));
	const regex = new RegExp(`(\\s+(?<suffix>${escaped.join("|")}))?$`);
	return { regex, method:nextNamed, suffixes:which.slice() };
}

function namesMatch(a: string, b: string, regex: RegExp) {
	return a.replace(regex, "").toLowerCase() === b.replace(regex, "").toLowerCase();
}

function nextNumeric(names: string[]) {
	let last = 0;
	names.forEach(name => {
		const { suffix } = numberRegex.exec(name)?.groups ?? { };
		const num = +(suffix ?? 0);
		last = Math.max(last, num);
	});
	return `#${last + 1}`;
}

function getAlphaList() {
	const aToZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
	const aToZZ = aToZ.slice();
	aToZ.forEach(left => aToZ.forEach(right => aToZZ.push(left + right)));
	return aToZZ;
}

function nextNamed(names: string[], regex: RegExp, suffixes: string[] = []) {
	let last = -1;
	names.forEach(name => {
		const { suffix } = regex.exec(name)?.groups ?? { };
		const index = suffixes.indexOf(suffix);
		console.log({ suffix, index });
		last = Math.max(last, index);
	});
	return suffixes[last + 1];
}

type NameResolvable = string | { name:string; };
function resolveName(resolvable: NameResolvable) {
	const name = typeof(resolvable) === "string" ? resolvable : resolvable.name;
	return name.trim();
}

export function renameDuplicate(resolvable: NameResolvable, others: NameResolvable[], type?: SuffixType) {
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