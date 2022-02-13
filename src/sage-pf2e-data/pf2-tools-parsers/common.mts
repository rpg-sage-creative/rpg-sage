import { BaseCore, Pf2ToolsData, Source, SourceCore, TDetail, THasSuccessOrFailure, type Pf2ToolsDataCore } from "../../sage-pf2e";
import utils, { OrNull } from "../../sage-utils";
import { compareNames, pf2tCores, sageCores } from "../common.mjs";
import type { TCore } from "../types.mjs";
import { parseSpell } from "./Spell.mjs";

export function split<T extends string = string>(values?: string): T[] | undefined {
	return values?.split(",") as T[];
}
export function splitAndCapitalize<T extends string = string>(values?: string): T[] | undefined {
	return values?.split(",").map(value => utils.StringUtils.capitalize(value)) as T[];
}

//#region sources

type TSource = { name:string; source?:Source; page:number; version?:string; };

function matchSourceNames(a: string, b: string): boolean {
	return a === b
		|| a.replace(/-/g, " ") === b.replace(/-/g, " ")
		|| a.replace(/Shadows$/, "Shadow") === b.replace(/Shadows$/, "Shadow")
		|| a.replace(/Pathfinder Society Guide/, "PFS Guide") === b.replace(/Pathfinder Society Guide/, "PFS Guide");
}

function matchSourceByName(cores: SourceCore[], name: string): SourceCore | undefined {
	return cores.find(core => core.objectType === "Source" && matchSourceNames(core.name, name));
}

function matchSourceByApName(cores: SourceCore[], name: string): SourceCore | undefined {
	return cores.find(core => core.objectType === "Source" && matchSourceNames(`${core.apNumber} ${core.name}`, name));
}

function matchSourceByProductLineName(cores: SourceCore[], name: string): SourceCore | undefined {
	return cores.find(core => core.objectType === "Source" && matchSourceNames(core.name, `${core.productLine}: ${name}`));
}

function matchSource(name: string): Source | undefined {
	const cores = sageCores.filter(core => core.objectType === "Source") as unknown as SourceCore[];
	const core = matchSourceByName(cores, name)
		?? matchSourceByProductLineName(cores, name)
		?? matchSourceByApName(cores, name);
	return core ? new Source(core) : undefined;
}

const missingSources: string[] = [];
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
	if (!source && !missingSources.includes(name)) {
		missingSources.push(name);
		console.log(`Unknown Source: ${name}`);
	}

	return { source, name, page, version }
}

//#endregion

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

function typesMatch(pf2: Pf2ToolsDataCore, sage: TCore): boolean {
	return Pf2ToolsData.objectTypeToPf2Type(sage) === pf2.type;
}

function namesMatch(pf2: Pf2ToolsDataCore, sage: TCore): boolean {
	if (compareNames(pf2, sage)) return true;
	if (sage.objectType === "Domain") return pf2.name === `${sage.name} Domain`;
	if (sage.objectType === "Deity") return pf2.name.split("(")[0].trim() === sage.name;
	return false;
}

function sourcesMatch(pf2: Pf2ToolsDataCore, sage: TCore): boolean {
	const pf2Source = parseSource(pf2.source);
	const sageSource = sageCores.find(src => src.objectType === "Source" && src.code === sage.source);
	return pf2Source?.source?.code && sageSource?.code ? pf2Source.source.code === sageSource.code : false;
}

export function findPf2tCore(core: TCore): Pf2ToolsDataCore | undefined {
	if (["Rule", "Table"].includes(core.objectType)
		|| (core.objectType === "Skill" && core.name.endsWith(" Lore"))) {
		return undefined;
	}
	return pf2tCores.filter(pf2 => typesMatch(pf2, core) && namesMatch(pf2, core) && sourcesMatch(pf2, core)).first();
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
	pf2tCores
	.filter(core => core.type === "spell")
	.forEach(pf2tCore => {
		const parsed: any = parseSpell(pf2tCore);
		const existing: any = sageCores.find(core => core.name === pf2tCore.name);
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
