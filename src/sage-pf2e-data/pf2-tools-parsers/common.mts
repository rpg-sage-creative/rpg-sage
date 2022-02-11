import { BaseCore, Pf2ToolsData, Source, SourceCore, TDetail, THasSuccessOrFailure, type Pf2ToolsDataCore } from "../../sage-pf2e";
import utils, { OrNull } from "../../sage-utils";
import { allCores, compareNames, debug, warn } from "../common.mjs";
import type { TCore } from "../types.mjs";
import { parseSpell } from "./Spell.mjs";

export function split<T extends string = string>(values?: string): T[] | undefined {
	return values?.split(",") as T[];
}
export function splitAndCapitalize<T extends string = string>(values?: string): T[] | undefined {
	return values?.split(",").map(value => utils.StringUtils.capitalize(value)) as T[];
}

type TSource = { name:string; source?:Source; page:number; version?:string; };
function matchNames(a: string, b: string): boolean {
	return a === b
		|| a.replace(/-/g, " ") === b.replace(/-/g, " ")
		|| a.replace(/Shadows$/, "Shadow") === b.replace(/Shadows$/, "Shadow")
		|| a.replace(/Pathfinder Society Guide/, "PFS Guide") === b.replace(/Pathfinder Society Guide/, "PFS Guide");
}
function matchSourceByName(cores: SourceCore[], name: string): SourceCore | undefined {
	return cores.find(core => core.objectType === "Source" && matchNames(core.name, name));
}
function matchSourceByApName(cores: SourceCore[], name: string): SourceCore | undefined {
	return cores.find(core => core.objectType === "Source" && matchNames(`${core.apNumber} ${core.name}`, name));
}
function matchSourceByProductLineName(cores: SourceCore[], name: string): SourceCore | undefined {
	return cores.find(core => core.objectType === "Source" && matchNames(core.name, `${core.productLine}: ${name}`));
}
function matchSource(name: string): Source | undefined {
	const cores = allCores.filter(core => core.objectType === "Source") as unknown as SourceCore[];
	const core = matchSourceByName(cores, name)
		?? matchSourceByProductLineName(cores, name)
		?? matchSourceByApName(cores, name);
	return core ? new Source(core) : undefined;
}
export function parseSource(value?: string): TSource | null {
	// "source": "Core Rulebook pg. 283 2.0",
	const parts = value?.match(/^(.*?) pg. (\d+)(?: \d+\.\d+)?$/);
	if (!parts) {
		return null;
	}

	const name = parts[1];
	const page = +parts[2];
	const version = parts[3];

	const source = matchSource(name);
	if (!source) {
		console.log(`Unknown Source: ${name}`);
	}

	return { source, name, page, version }
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

// function successFailure(lines: string[]): THasSuccessOrFailure {
// 	const criticalSuccess = findAndRemove(lines, "Critical Success", 1);
// 	const success = findAndRemove(lines, "Success", 1);
// 	const failure = findAndRemove(lines, "Failure", 1);
// 	const criticalFailure = findAndRemove(lines, "Critical Failure", 1);
// 	return { criticalSuccess, success, failure, criticalFailure }
// }

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

// function objectTypeToPf2Type(sageCore: TCore) {
// 	if (sageCore.objectType === "ClassPath") {
// 		const clss = allCores.find(core => core.objectType === "Class" && core.name === sageCore.class);
// 		return clss?.classPath?.replace(/\s+/, "").toLowerCase();
// 	}
// 	if (sageCore.objectType === "Faith") return "deity";
// 	if (sageCore.objectType === "FocusSpell") return "focus";
// 	if (sageCore.objectType === "Gear") return "item";
// 	return sageCore.objectType.toLowerCase();
// }

// function nameGotFixed(pf2: Pf2Tools.Pf2ToolsDataCore, sage: TCore) {
// 	return pf2?.name === "MONKEY TOWN" && sage?.name === "HOT STUFF";
// 	// if (sage.objectType === "Domain" && pf2.name === `${sage.name} Domain`) return sage.name = `${sage.name} Domain`;
// }

function testPf2Name(pf2: Pf2ToolsDataCore, sage: TCore) {
	if (compareNames(pf2, sage)) return true;
	if (sage.objectType === "Domain") return pf2.name === `${sage.name} Domain`;
	if (sage.objectType === "Deity") return pf2.name.split("(")[0].trim() === sage.name;
	return false;
}

// export function checkPf2ToolsForName(core: TCore) {
// 	if (["Rule"].includes(core.objectType)) return;
// 	const pf2Type = objectTypeToPf2Type(core);
// 	const filtered = getPf2ToolsData().filter(o => o.type === pf2Type);
// 	return filtered.find(pf2 => nameGotFixed(pf2, core));
// }

export function checkPf2ToolsForAonAndHash(core: TCore): [number | undefined, string | undefined] {
	if (["Rule"].includes(core.objectType)) return [undefined, undefined];
	const pf2Type = Pf2ToolsData.objectTypeToPf2Type(core);
	const filtered = Pf2ToolsData.getAll().filter(o => o.type === pf2Type && testPf2Name(o, core));
	// if (filtered.length > 1) {
	// 	console.log(`Too many matches! ${core.objectType}:${core.name}`, filtered);
	// }
	const found = filtered[0];
	const cannotFind: string[] = [];
	const retVal: [number | undefined, string | undefined] = [undefined, undefined];
	if (found) {
		if (found.id !== core.id) {
			debug(`Setting PF2Tools id for "${found.type}:${found.name}" from "${found.id}" to "${core.objectType}:${core.name}" "${core.id}"`);
			found.id = core.id;
		}
		if (found.hash) {
			if (core.hash !== found.hash) {
				retVal[1] = found.hash;
				warn(`\tMissing hash for ${core.objectType}:${core.name} >> PF2-TOOLS(${found.hash})`);
			}
		}else {
			cannotFind.push("hash");
		}
		if (found.aon) {
			const match = found.aon.match(/(\D+)(\d+)/i) ?? [];
			const aonId = +match[2];
			if (aonId && core.aonId !== aonId) {
				retVal[0] = aonId;
				warn(`\tMissing aonId for ${core.objectType}:${core.name} >> PF2-TOOLS(${found.aon})`);
			}
		}else {
			cannotFind.push("aonId");
		}
	}else {
		if (!core.aonId) {
			cannotFind.push("aonId");
		}
		if (!core.hash) {
			cannotFind.push("hash");
		}
	}
	if (cannotFind.length) {
		const unique = cannotFind.filter((s,i,a )=> a.indexOf(s) === i).sort();
		warn(`\tMissing ${unique.join(", ")} for ${core.objectType}:${core.name} >> CANNOT FIND IT IN PF2-TOOLS`);
	}
	return retVal;
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
// function logToString<T>(object: T): string {
// 	return isObject(object) ? JSON.stringify(object) : String(object);
// }

//#region parse pf2data

export function parsePf2Data() {
	Pf2ToolsData.getAll()
	.filter(core => core.type === "spell")
	.forEach(pf2tCore => {
		const parsed: any = parseSpell(pf2tCore);
		const existing: any = allCores.find(core => core.name === pf2tCore.name);
		if (parsed && existing) {
			Object.keys(existing).forEach(key => {
				if (!["id","description"].includes(key)) {
					if (!compare(existing[key],parsed[key])) {
						// console.log(`"${existing.name}"${key}: "${logToString(existing[key])}" vs "${logToString(parsed[key])}"`);
					}
				}
			});
		}
	});
}

//#endregion
