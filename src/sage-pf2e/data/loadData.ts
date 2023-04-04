import type { Optional } from "../../sage-utils";
import { errorReturnEmptyArray } from "../../sage-utils/ConsoleUtils";
import { filterFiles, readJsonFile } from "../../sage-utils/FsUtils";
import type { BaseCore } from "../model/base/Base";
import { Pf2tBase, Pf2tBaseCore } from "../model/base/Pf2tBase";
import { getChildParser, hasObjectType, loadPf2t, loadSageCore } from "./repoMap";

const missing: string[] = [];

export async function loadData(dataPath: string, includePf2ToolsData = false): Promise<void> {
	const distPath = `${dataPath}/dist`.replace(/\/+/g, "/");
	await loadDataFromDist(distPath);
	if (includePf2ToolsData) {
		return loadFromPF2t(distPath);
	}
	return Promise.resolve();
}

function handleMissingObjectType(core: BaseCore, fromLabel: string): void {
	if (!missing.includes(core.objectType)) {
		missing.push(core.objectType);
		console.warn(`Missing parser for "${core.objectType}" from "${fromLabel}" ("${core.name}")`);
	}
}

/**
 * @deprecated Find another way!
*/
function parseChildren(core: BaseCore, fromLabel: string): number {
	const childParser = getChildParser(core.objectType);
	if (childParser) {
		let childrenLoaded = 0;
		const childCores = childParser(core) ?? [];
		childCores.forEach(childCore => {
			const loaded = loadCore(childCore, fromLabel);
			if (!loaded) {
				console.warn(`Error parsing child core!`, core, childCore);
			}
			childrenLoaded += loaded;
		});
		return childrenLoaded;
	}
	return 0;
}

function loadCore(core: Optional<BaseCore>, fromLabel: string): number {
	if (!core) {
		console.warn(`Invalid core from "${fromLabel}": ${core}`);
		return 0;
	}

	const objectType = core.objectType;
	if (!objectType) {
		handleMissingObjectType(core, fromLabel);
		return 0;
	}

	if (!hasObjectType(objectType)) {
		handleMissingObjectType(core, fromLabel);
		return 0;
	}

	const childrenParsed = parseChildren(core, fromLabel);
	loadSageCore(core);
	return 1 + childrenParsed;
}

async function loadDataFromDist(distPath: string): Promise<void> {
	const files: string[] = await filterFiles(distPath, file => file.endsWith(".json") && !file.includes("pf2t-leftovers"), true)
		.catch(errorReturnEmptyArray);
	if (!files.length) {
		console.warn(`No files in "${distPath}" ...`);
		return Promise.resolve();
	}

	let coresLoaded = 0;

	const sources = files.filter(file => file.includes("/Source/"));
	console.info(`Loading Data: ${sources.length} sources`);
	for (const source of sources) {
		await readJsonFile<BaseCore>(source).then(core => coresLoaded += loadCore(core, source), console.warn);
	}

	const others = files.filter(file => !file.includes("/Source/"));
	console.info(`Loading Data: ${others.length} objects`);
	for (const other of others) {
		await readJsonFile<BaseCore>(other).then(core => coresLoaded += loadCore(core, other), console.warn);
	}

	console.info(`\t\t${coresLoaded} Total Cores loaded`);

	return Promise.resolve();
}

async function loadFromPF2t(distPath: string): Promise<void> {
	const pathAndFile = `${distPath}/pf2t-leftovers.json`;
	const cores = await readJsonFile<Pf2tBaseCore[]>(pathAndFile).catch(() => null) ?? [];
	console.info(`\t\t${cores.length} Total PF2 Tools Cores loaded`);
	cores.forEach(core => loadPf2t(new Pf2tBase(core)));
}
