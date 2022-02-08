import utils from "../sage-utils";
import type { TCore } from "./types.mjs";

export const SrcDataPath = "./data/src";
export const DistDataPath = "./data/dist";

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

export const allCores: TCore[] = [];

const cleanNames = new Map<string, string>();
type TData = { id?:string; hash?:string; name?:string; };
function cleanName(data: TData): string {
	const key = data.id ?? data.hash;
	if (!key || !data.name) throw new Error(`Invalid Object to compare! ${data.hash ?? data.id ?? data}`);
	if (!cleanNames.has(key)) {
		cleanNames.set(key, utils.StringUtils.StringMatcher.clean(data.name));
	}
	return cleanNames.get(key)!;
}
export function compareNames(a: TData, b: TData): boolean {
	return cleanName(a) === cleanName(b);
}
