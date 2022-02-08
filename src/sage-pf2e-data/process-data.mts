import * as fs from "fs";
import { Pf2Tools, THasSuccessOrFailure } from "../sage-pf2e";
import utils, { type UUID } from "../sage-utils";
import { allCores, compareNames, debug, DistDataPath, error, info, log, SrcDataPath, warn } from "./common.mjs";
import { checkPf2ToolsForAonId, getPf2ToolsData, loadPf2ToolsData, parsePf2Data } from "./pf2-tools-parsers/common.mjs";
import { processAbcData } from "./process-abc.mjs";
import type { TCore } from "./types.mjs";

let total = 0, created = 0, unique = 0, recreated = 0, normalized = 0, aoned = 0;

//#region unique uuids
const allIds: UUID[] = [];
function isUnique(uuid: UUID): boolean {
	if (allIds.includes(uuid)) return false;
	allIds.push(uuid);
	return true;
}
function createUuid(): UUID {
	let uuid;
	do { uuid = utils.UuidUtils.generate(); }while(!isUnique(uuid));
	return uuid;
}
//#endregion

const sourcePaths: string[] = [];
function getPathForSource(source: TCore) {
	const paths = [
		`${SrcDataPath}/${source.code}`,
		`${SrcDataPath}/${source.code} ${source.name}`,
		`${SrcDataPath}/${source.name}`,
		`${SrcDataPath}/${source.name} ${source.code}`
	];
	const found = paths.find(path => fs.existsSync(path));
	if (found) {
		sourcePaths.push(found);
	}else {
		debug(`  Not Parsing ${source.code} ${source.name}`);
	}
	return found;
}
function getFullPathOfAllJsonFilesIn(path?: string) {
	if (!path) { return []; }
	const names = fs.readdirSync(path);
	const json = names.filter(name => name.endsWith(".json")).map(name => `${path}/${name}`);
	const subs = names.filter(name => !name.includes(".")).map(name => getFullPathOfAllJsonFilesIn(`${path}/${name}`));
	subs.forEach(sub => json.push(...sub));
	return json;
}
function getNonSourcePaths() {
	return fs.readdirSync(SrcDataPath)
		.filter(name => !name.includes("."))
		.map(name => `${SrcDataPath}/${name}`)
		.filter(path => !sourcePaths.includes(path));
}

function processSources() {
	info(`\nProcessing source-list.json ...`);
	const sources = processData(`${SrcDataPath}/source-list.json`) as TCore[];
	sources.forEach(source => getFullPathOfAllJsonFilesIn(getPathForSource(source)).forEach(processData));
	const nonSources = getNonSourcePaths();
	if (nonSources.length) {
		debug("===============\nThe Following Sources are not in source-list.json");
		nonSources.forEach(path => getFullPathOfAllJsonFilesIn(path).forEach(processData));
		debug("===============");
	}
	info(`Processing source-list.json ... ${total} items; u${unique} IDs; +${created} IDs; ♻️${recreated} IDs; ~${normalized} IDs; +${aoned} aonIDs`);
}

/** Returns TRUE if the source is valid and is missing aonId */
function validateSource(path: string, core: TCore) {
	if (core.objectType !== "Source") {
		if (!core.source) {
			warn(`\tMissing source for ${core.objectType}:${core.name}`);
		}else {
			const source = allCores.find(c => c.objectType === "Source" && c.code === core.source);
			if (!source) {
				warn(`\tInvalid source for ${core.objectType}:${core.name} (${core.source})`);
			}else if (!path.includes(source.code!) && !path.includes(source.name)) {
				warn(`\tWrong source for ${core.objectType}:${core.name} (${core.source})`);
			}
			return !source?.aonId;
		}
	}
	return undefined;
}
function validateAbbreviation(core: TCore) {
	if (core.objectType === "Source" && core.abbreviation && allCores.find(c => c !== core && c.objectType === "Source" && c.abbreviation === core.abbreviation)) {
		error(`\tDuplicate source abbreviation '${core.abbreviation}' for ${core.name}`);
	}
}
function pluralObjectType(objectType: string) { return `${objectType}s`.toLowerCase(); }
function updatePreviousId(core: TCore) {
	const index = allCores.indexOf(core);
	const prev = allCores[index - 1];
	if (prev?.objectType !== core.objectType || prev?.name !== core.name) return false;
	if (core.version && !core.previousId) {
		core.previousId = prev.id;
		return true;
	}
	return false;
}
function processData(filePathAndName: string) {
console.log(filePathAndName, fs.existsSync(filePathAndName))
	const coreList = utils.FsUtils.readJsonFileSync(filePathAndName) as TCore[];

	//#region invalid file/data
	if (!coreList) {
		warn(`Invalid file! ${filePathAndName}`);
		return;
	}
	if (!Array.isArray(coreList)) {
		error(`Invalid data! ${filePathAndName}`)
	}
	//#endregion

	let _created = 0, _recreated = 0, _normalized = 0, _aoned = 0, updateFile = false;

	//#region invalid source/folder
	if (!filePathAndName.includes("source-list") && coreList.find(core => !filePathAndName.includes(core.source!) && !filePathAndName.includes(pluralObjectType(core.objectType)))) {
		fs.rmSync(filePathAndName);
		const fileName = filePathAndName.split("/").pop();
		const coreSources = coreList.map(core => core.source).filter((s, i, a) => s && a.indexOf(s) === i);
		coreSources.forEach(src => {
			const srcCores = coreList.filter(core => core.source === src);
			const _filePathAndName = `${SrcDataPath}/${src}/${pluralObjectType(srcCores[0].objectType)}/${fileName}`;
			warn(`Moving ${srcCores.length} from ${filePathAndName} to ${_filePathAndName}`)
			utils.FsUtils.writeFileSync(_filePathAndName, srcCores, true, true);
			processData(_filePathAndName);
		});
		return coreList;
	}
	//#endregion

	debug(`Parsing (${coreList.length}): ${filePathAndName}`);
	total += coreList.length;

	for (const core of coreList) {
		allCores.push(core);
		if (!core.id) {
			core.id = createUuid();
			_created++;
		}else if (!isUnique(core.id)) {
			core.id = createUuid();
			_recreated++;
		}else {
			unique++;
			if (utils.UuidUtils.isNotNormalized(core.id)) {
				core.id = utils.UuidUtils.normalize(core.id);
				_normalized++;
			}
		}
		if (updatePreviousId(core)) {
			updateFile = true;
		}
		if (core.objectType === "Class" && !core.classPath) {
			warn(`\tMissing ClassPath for ${core.name}`);
		}
		if (Pf2Tools.default.checkForName(core)) {
			updateFile = true;
		}
		if (core.parent === core.name) {
			error(`Cannot be parent of self! ${core.objectType}::${core.name}`);
		}
		if (core.objectType === "Feat" && core.traits?.includes("Dedication")) {
			core.objectType = "DedicationFeat";
			updateFile = true;
		}
		if (typeof(core.details) === "string") {
			core.details = [core.details];
			updateFile = true;
		}
		if (core.criticalSuccess || core.success || core.failure || core.criticalFailure || core.followUp) {
			const successFailure = { } as THasSuccessOrFailure;
			if (core.criticalSuccess?.length) successFailure.criticalSuccess = core.criticalSuccess;
			if (core.success?.length) successFailure.success = core.success;
			if (core.failure?.length) successFailure.failure = core.failure;
			if (core.criticalFailure?.length) successFailure.criticalFailure = core.criticalFailure;
			if (!core.details) core.details = [];
			if (Object.keys(successFailure).length) core.details.push(successFailure);
			if (core.followUp) core.details.push(...core.followUp);
			delete core.criticalSuccess;
			delete core.success;
			delete core.failure;
			delete core.criticalFailure;
			delete core.followUp;
			updateFile = true;
		}
		const sourceMissingAonId = validateSource(filePathAndName, core);
		if (!sourceMissingAonId && !core.aonId && !["Table"].includes(core.objectType) && !(core.objectType === "Skill" && core.name.endsWith(" Lore"))) {
			const aonId = checkPf2ToolsForAonId(core);
			if (aonId) {
				core.aonId = aonId;
				_aoned++;
			}
		}
		validateAbbreviation(core);
		utils.FsUtils.writeFileSync(`${DistDataPath}/${core.objectType}/${core.id}.json`, core, true, false);
	}
	created += _created;
	recreated += _recreated;
	normalized += _normalized;
	aoned += _aoned;
	if (_created || _recreated || _normalized || _aoned || updateFile) {
		info(`\tSaving ${_created} IDs created, ${_recreated} IDs recreated, ${_normalized} IDs normalized, and ${_aoned} aonIDs set`);
		utils.FsUtils.writeFileSync(filePathAndName, coreList, false, true);
	}
	return coreList;
}

function processMissingSpells() {
	info(`\nChecking for missing spells ...`);
	const missing = getPf2ToolsData().filter(pf2 => !allCores.find(core => compareNames(core, pf2)));
	const missingSpells = missing.filter(sp => sp.type === "spell");
	info(`Checking for missing spells ... found ${missingSpells.length}!`);
	log(`\t${missingSpells.map(sp => `${sp.name} (${sp.source})`).join("\n\t")}`);
}

//#region lore
type TLore = { name:string; type?:string; }
const allLores: TLore[] = [];
function pushLore(name: string, type?: string) {
	const found = allLores.find(lore => lore.name === name);
	if (!found) {
		allLores.push({ name, type });
	}else if (type) {
		found.type = type;
	}
}
function processLore() {
	info(`Creating all-lores.csv ...`);
	const loreRegex = /([A-Z]\w+\s+)+Lore/g;
	allCores.forEach(core => {
		if (["Deity","Ancestry","VersatileHeritage"].includes(core.objectType)) {
			pushLore(`${core.name} Lore`, core.objectType);
		}
		const string = JSON.stringify(core);
		const lores = string.match(loreRegex);
		lores?.forEach(lore => pushLore(lore));
	});
	allLores.sort((a, b) => a.name === b.name ? 0 : a.name < b.name ? -1 : 1);
	fs.writeFileSync("./data/all-lores.csv", allLores.map(lore => `${lore.name},${lore.type ?? ""}`).join("\n"));
	info(`Creating all-lores.csv ... done!`);
}
//#endregion

export default async function process(): Promise<void> {
	await loadPf2ToolsData();

	processSources();
	processAbcData();
	processMissingSpells();
	processLore();

	parsePf2Data();

	info(""); // spacer for bash script
}
