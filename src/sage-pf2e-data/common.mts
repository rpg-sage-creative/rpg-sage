import type { SourceCore } from "../sage-pf2e/model/base/Source";
import type { ClassCore } from "../sage-pf2e/model/Class";
import { StringMatcher } from "../sage-utils/StringUtils";
import type { TCore } from "./types.mjs";

export const SrcDataPath = "../data/pf2e/src";
export const DistDataPath = "../data/pf2e/dist";

const VERBOSE = false;
const DEBUGGING = false;
export function info(...args: any[]) {
	console.info(...args);
}
export function log(...args: any[]) {
	if (VERBOSE) {
		console.log(...args);
	}
}
export function warn(...args: any[]) {
	if (VERBOSE) {
		console.warn(...args);
	}
}
export function error(...args: any[]) {
	console.error(...args);
}
export function debug(...args: any[]) {
	if (DEBUGGING) {
		console.debug(...args);
	}
}

const sageCores: TCore[] = [];
export function getSageCores(): TCore[]
export function getSageCores(objectType: "Source"): SourceCore[];
export function getSageCores(objectType: "Class"): ClassCore[];
export function getSageCores(objectType?: string): any {
	if (objectType) {
		return sageCores.filter(core => core.objectType === objectType);
	}
	return sageCores;
}

const cleanNames = new Map<string, string>();
type TData = { id?:string; hash?:string; name?:string; };
function cleanName(data: TData): string {
	const key = data.id ?? data.hash;
	if (!key || !data.name) throw new Error(`Invalid Object to compare! ${data.hash ?? data.id ?? data}`);
	if (!cleanNames.has(key)) {
		cleanNames.set(key, StringMatcher.clean(data.name));
	}
	return cleanNames.get(key)!;
}

export function compareNames(a: TData, b: TData): boolean {
	return cleanName(a) === cleanName(b);
}

const stringifyMap = new Map<string, string>();
export function clearStringify(key: string): void {
	stringifyMap.delete(key);
}
export function stringify(core: TCore): string;
export function stringify(core?: TCore | undefined): string | undefined;
export function stringify(core?: TCore): string | undefined {
	if (!core) return undefined;
	const key = core.id;
	if (!stringifyMap.has(key)) {
		stringifyMap.set(key, JSON.stringify(core));
	}
	return stringifyMap.get(key)!;
}