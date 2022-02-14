import type { Pf2ToolsDataCore } from "../sage-pf2e/data/Pf2ToolsData";
import utils from "../sage-utils";
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

export const sageCores = new utils.ArrayUtils.Collection<TCore>();

const PF2_TOOLS_URL = "https://character.pf2.tools/assets/json/all.json";
export const pf2tCores = new utils.ArrayUtils.Collection<Pf2ToolsDataCore>();
export async function loadPf2tCores(): Promise<void> {
	const path = `${SrcDataPath}/pf2t-all.json`;
	let cores = await utils.FsUtils.readJsonFile<Pf2ToolsDataCore[]>(path).catch(() => null) ?? [];
	if (!cores.length) {
		info(`\t\tFetching PF2 Tools Cores ...`);
		cores = await utils.HttpsUtils.getJson<Pf2ToolsDataCore[]>(PF2_TOOLS_URL).catch(() => []);
		await utils.FsUtils.writeFile(path, cores, true, true);
	}
	info(`\t\t${cores.length} Total PF2 Tools Cores loaded`);
	pf2tCores.push(...cores);
}

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
