import { BaseCore, Pf2tBase, Pf2tBaseCore, TDetail, THasSuccessOrFailure } from "../../sage-pf2e";
import utils, { OrNull } from "../../sage-utils";
import { compareNames, getPf2tCores, getSageCores } from "../common.mjs";
import type { TCore } from "../types.mjs";
import { parseSpell } from "./Spell.mjs";

export function split<T extends string = string>(values?: string): T[] | undefined {
	return values?.split(",") as T[];
}
export function splitAndCapitalize<T extends string = string>(values?: string): T[] | undefined {
	return values?.split(",").map(value => utils.StringUtils.capitalize(value)) as T[];
}

export function findAndRemove(lines: string[], key: string): string | undefined;
export function findAndRemove(lines: string[], key: string, count: number): string[] | undefined;
export function findAndRemove(lines: string[], key: string, count?: number): string | string[] | undefined {
	const prefix = `**${key}**`;
	const index = lines.findIndex(line => typeof(line) === "string" && line.startsWith(prefix));
	if (index > -1) {
		const spliced = lines.splice(index, count ?? 1);
		spliced[0] = spliced[0].slice(prefix.length).trim();
		return count ? spliced : spliced[0];
	}
	return undefined;
}

function cleanDetails(lines: TDetail[]): void {
	const regex = /^\*\*((?:Critical )?(?:Success|Failure))\*\*\s*(.*?)$/i;
	const matches: OrNull<RegExpMatchArray>[] = [];
	const indexes: number[] = [];
	do {
		indexes.length = 0;
		matches.length = 0;
		indexes[0] = lines.findIndex(line => typeof(line) === "string" ? matches[0] = line.match(regex) : false);
		if (indexes[0] > -1) {
			for (let i = 1; i < 4; i++) {
				indexes[i] = (matches[i] = String(lines[indexes[0] + i]).match(regex)) ? indexes[0] + i : -1;
			}
			const detail: THasSuccessOrFailure = { };
			for (let i = 4; i--;) {
				if (indexes[i] > -1) {
					lines.splice(indexes[i], 1);
					detail[labelToKey(matches[i]![1]) as keyof THasSuccessOrFailure] = [matches[i]![2]];
				}
			}
			lines.splice(indexes[0], 0, detail);
		}
	}
	while (matches[0]);
}
export function labelToKey(label: string): string {
	return label[0].toLowerCase() + label.slice(1).replace(/\s+/, "");
}
export function parseBody<T extends BaseCore>(body: string): Partial<T> {
	const parsedBody: any = { };
	const details = body?.split(/\n/) ?? [];
	cleanDetails(details);
	parsedBody["details"] = details;
	return parsedBody;
}

//#region pf2tools

//#region objectType to type

export function objectTypeToPf2Type(sageCore: TCore): string;
export function objectTypeToPf2Type(objectType: string): string;
export function objectTypeToPf2Type(objectType: string, cleanOnly: true): string;
export function objectTypeToPf2Type(sageCore: TCore | string, cleanOnly?: true): string {
	if (typeof(sageCore) === "string") {
		return cleanOnly === true ? cleanType(sageCore) : toPf2Type(sageCore);
	}
	if (sageCore.objectType === "ClassPath") {
		const clss = getSageCores("Class").find(klass => klass.name === sageCore.class);
		return toPf2Type(clss?.classPath ?? sageCore.objectType);
	}
	if (["Spell","FocusSpell"].includes(sageCore.objectType) && sageCore.traits?.includes("Cantrip")) {
		return toPf2Type("Cantrip");
	}
	return toPf2Type(sageCore.objectType);
}

function toPf2Type(value: string): string {
	switch (value) {
		// "classpath" would need to get the name of the classpath, such as "racket"
		case "Armor": return "item";
		case "DedicationFeat": return "feat";
		case "Faith": return "deity";
		case "FocusSpell": return "focus";
		case "Gear": return "item";
		case "VersatileHeritage": return "heritage";
		default: return cleanType(value);
	}
}

function cleanType(value: string): string {
	return value.replace(/[\s']/g, "").toLowerCase();
}

//#endregion

function typesMatch(pf2t: Pf2tBaseCore, sage: TCore): [boolean, string] {
	const cleanType = objectTypeToPf2Type(sage.objectType, true);
	if (pf2t.type === cleanType) {
		return [true, cleanType];
	}
	const simpleType = objectTypeToPf2Type(sage.objectType);
	if (pf2t.type === simpleType) {
		return [true, simpleType];
	}
	const sageType = objectTypeToPf2Type(sage);
	return [pf2t.type === sageType, sageType];
}

function namesMatch(pf2t: Pf2tBaseCore, sage: TCore): boolean {
	if (compareNames(pf2t, sage)) return true;
	if (sage.objectType === "Armor") return pf2t.name === `${sage.name} Armor`;
	if (sage.objectType === "Domain") return pf2t.name === `${sage.name} Domain`;
	if (sage.objectType === "Deity") return pf2t.name.split("(")[0].trim() === sage.name;
	return false;
}

const sourceMatches = new Map<string, boolean>();
function sourcesMatch(pf2t: Pf2tBaseCore, sage: TCore): boolean {
	const key = `${pf2t.source} === ${sage.source}`;
	if (!sourceMatches.has(key)) {
		const sourceCores = getSageCores("Source");
		const pf2Source = Pf2tBase.parseSource(pf2t.source, sourceCores);
		const sageSource = sourceCores.find(src => src.code === sage.source);
		sourceMatches.set(key, pf2Source?.source?.code && sageSource?.code ? pf2Source.source.code === sageSource.code : false);
	}
	return sourceMatches.get(key)!;
}

type TCoreMatchResults = {
	pf2t: Pf2tBaseCore;
	sage: TCore;
	sageType?: string;
	name: boolean;
	type?: boolean;
	source?: boolean;
	none: boolean;
	some: boolean;
	all: boolean;
	count: number;
};

export function coresMatch(pf2t: Pf2tBaseCore, sage: TCore): TCoreMatchResults {
	const name = namesMatch(pf2t, sage);
	const [type, sageType] = name ? typesMatch(pf2t, sage) : [false, undefined];
	const source = name ? sourcesMatch(pf2t, sage) : undefined;
	const none = !name && type === false && source === false;
	const some = name || type === true || source === true;
	const all = name && type === true && source === true;
	const count = (name ? 1 : 0) + (type ? 1 : 0) + (source ? 1 : 0);
	return { pf2t, sage, sageType, name, type, source, none, some, all, count };
}

export function findPf2tCore(sage: TCore): Pf2tBaseCore | undefined {
	if (["Rule", "Table"].includes(sage.objectType)
		|| (sage.objectType === "Skill" && sage.name.endsWith(" Lore"))) {
		return undefined;
	}
	return getPf2tCores().find(pf2t => coresMatch(pf2t, sage).all);
}

//#endregion

//#region object comparison
type TPrimitive = string | number;
function isPrimitive<T extends TPrimitive>(object: any): object is T {
	return ["string","number"].includes(typeof(object));
}
function comparePrimitive<T extends TPrimitive>(a: T, b: T): boolean {
	return a === b;
}
function compareArray<T>(a: T[], b: T[]): boolean {
	return a.length === b.length && !a.find((_a, i) => !compare(_a, b[i]));
}
function isObject<T>(object: any): object is T {
	return typeof(object) === "object";
}
function compareObject<T, U extends keyof T>(a: T, b: T): boolean {
	const aKeys = Object.keys(a).sort() as U[];
	const bKeys = Object.keys(b).sort() as U[];
	if (aKeys.length === bKeys.length && !aKeys.find((key, i) => key !== bKeys[i])) {
		return !aKeys.find(key => !compare(a[key], b[key]))
	}
	return false;
}
function compare<T>(a: T, b: T): boolean {
	if (isPrimitive(a) && isPrimitive(b)) {
		return comparePrimitive(a, b);
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		return compareArray(a, b);
	}
	if (isObject(a) && isObject(b)) {
		return compareObject(a, b);
	}
	return a === b;
}
//#endregion
function logToString<T>(object: T): string {
	return isObject(object) ? JSON.stringify(object) : String(object);
}

//#region parse pf2data

export function parsePf2Data() {
	getPf2tCores()
	.filter(core => core.type === "spell")
	.forEach(pf2tCore => {
		const parsed: any = parseSpell(pf2tCore);
		const existing: any = getSageCores().find(core => core.name === pf2tCore.name);
		if (parsed && existing) {
			Object.keys(existing).forEach(key => {
				if (!["id","description"].includes(key)) {
					if (!compare(existing[key],parsed[key])) {
						console.log(`"${existing.name}"${key}: "${logToString(existing[key])}" vs "${logToString(parsed[key])}"`);
					}
				}
			});
		}
	});
}

//#endregion
