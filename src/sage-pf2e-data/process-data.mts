import * as fs from "fs";
import { clearStringify, stringify } from "./common.mjs";
import type { Pf2tBaseCore, THasSuccessOrFailure } from "../sage-pf2e";
import utils, { type UUID } from "../sage-utils";
import { compareNames, debug, DistDataPath, error, info, loadPf2tCores, log, sageCores, SrcDataPath, warn } from "./common.mjs";
import { findPf2tCore, parsePf2Data } from "./pf2-tools-parsers/common.mjs";
import { processAbcData } from "./process-abc.mjs";
import { processPf2tData } from "./processPf2taData.mjs";
import type { TCore } from "./types.mjs";

let total = 0, created = 0, unique = 0, recreated = 0, normalized = 0, aoned = 0, linked = 0;

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

function processSources(): void {
	info(`\nProcessing source-list.json ...`);
	const sources = processData(`${SrcDataPath}/source-list.json`) as TCore[];
	sources.forEach(source => getFullPathOfAllJsonFilesIn(getPathForSource(source)).forEach(processData));
	const nonSources = getNonSourcePaths()
		.filter(path => !path.includes("LG_LKSE"));
	if (nonSources.length) {
		debug("===============\nThe Following Sources are not in source-list.json");
		nonSources.forEach(path => getFullPathOfAllJsonFilesIn(path).forEach(processData));
		debug("===============");
	}
	info(`Processing source-list.json ... ${total} items; u${unique} IDs; +${created} IDs; ♻️${recreated} IDs; ~${normalized} IDs; +${aoned} aonIDs; +${linked} linked`);
}

/** Returns TRUE if the source is valid and is missing aonId */
function warnInvalidSource(path: string, core: TCore): void {
	if (core.objectType !== "Source") {
		if (!core.source) {
			warn(`\tMissing source for ${core.objectType}:${core.name}`);
		}else {
			const source = sageCores.find(c => c.objectType === "Source" && c.code === core.source);
			if (!source) {
				warn(`\tInvalid source for ${core.objectType}:${core.name} (${core.source})`);
			}else if (!path.includes(source.code!) && !path.includes(source.name)) {
				warn(`\tWrong source for ${core.objectType}:${core.name} (${core.source})`);
			}
		}
	}
}
function validateAbbreviation(core: TCore) {
	if (core.objectType === "Source" && core.abbreviation && sageCores.find(c => c !== core && c.objectType === "Source" && c.abbreviation === core.abbreviation)) {
		error(`\tDuplicate source abbreviation '${core.abbreviation}' for ${core.name}`);
	}
}
function pluralObjectType(objectType: string) { return `${objectType}s`.toLowerCase(); }
function updatePreviousId(core: TCore) {
	const index = sageCores.indexOf(core);
	const prev = sageCores[index - 1];
	if (prev?.objectType !== core.objectType || prev?.name !== core.name) return false;
	if (core.version && !core.previousId) {
		core.previousId = prev.id;
		return true;
	}
	return false;
}
function warnMissingClassPath(core: TCore): void {
	if (core.objectType === "Class" && !core.classPath && !["Fighter","Monk"].includes(core.name)) {
		warn(`\tMissing ClassPath for ${core.name}`);
	}
}
function warnSelfParent(core: TCore): void {
	if (core.parent === core.name) {
		error(`Cannot be parent of self! ${core.objectType}::${core.name}`);
	}
}
function fixDedicationFeatObjectType(core: TCore): boolean {
	if (core.objectType === "Feat" && core.traits?.includes("Dedication")) {
		core.objectType = "DedicationFeat";
		return true;
	}
	return false;
}

function processData(filePathAndName: string) {
	info(`Processing file: ${filePathAndName} ...`);
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

	let _created = 0, _recreated = 0, _normalized = 0, _aoned = 0, _linked = 0, updateFile = false;

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

	ensureTrait(coreList);

	for (const core of coreList) {
		sageCores.push(core);
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
		warnMissingClassPath(core);
		// check to see if we need to update the name?
		warnSelfParent(core);
		if (fixDedicationFeatObjectType(core)) {
			updateFile = true;
		}
		if (fixDetails(core)) {
			updateFile = true;
		}
		warnInvalidSource(filePathAndName, core);
		if (fixPf2tAon(core)) {
			_aoned++;
			updateFile = true;
		}
		if (updatePf2t(core)) {
			_linked++;
			updateFile = true;
		}
		validateAbbreviation(core);
		delete (core as any).hash;
		utils.FsUtils.writeFileSync(`${DistDataPath}/${core.objectType}/${core.id}.json`, core, true, false);
	}

	created += _created;
	recreated += _recreated;
	normalized += _normalized;
	aoned += _aoned;
	linked += _linked;
	if (_created || _recreated || _normalized || _aoned || _linked || updateFile) {
		info(`\tSaving ${_created} IDs created, ${_recreated} IDs recreated, ${_normalized} IDs normalized, ${_aoned} aonIDs set, and ${_linked} links set`);
		utils.FsUtils.writeFileSync(filePathAndName, coreList, false, true);
	}
	// info(`Processing file: ${filePathAndName} ... done`);
	return coreList;
}

function ensureTrait(coreList: TCore[]): void {
	["Class","Ancestry","Archetype","VersatileHeritage"].forEach(objectType => {
		const missingTraits = coreList.filter(core => core.objectType === objectType && !coreList.find(c => c.objectType === "Trait" && c.name === core.name));
		missingTraits.forEach(core => {
			const traitCore = { objectType:"Trait", name:core.name, source:core.source, id:createUuid() } as TCore;
			coreList.splice(coreList.indexOf(core), 0, traitCore);
		});
	});
}

function fixDetails(core: TCore): boolean {
	let updated = false;
	if (typeof(core.details) === "string") {
		core.details = [core.details];
		updated = true;
	}
	if (fixHasSuccessOrFailure(core)) {
		updated = true;
	}
	return updated;
}

function fixHasSuccessOrFailure(core: TCore): boolean {
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
		return true;
	}
	return false;
}

function fixPf2tAon(core: TCore): boolean {
	const found = findPf2tCore(core);
	if (found?.aon) {
		const match = found.aon.match(/(\D+)(\d+)/i) ?? [];
		const aonId = +match[2];
		if (aonId) {
			if (core.aonId === aonId) {
				warn(`\tUpdated aonId for ${core.objectType}:${core.name}:${core.aonId} >> PF2-TOOLS(${found.aon})`);
			}else {
				warn(`\tMissing aonId for ${core.objectType}:${core.name} >> PF2-TOOLS(${found.aon})`);
				core.aonId = aonId;
				return true;
			}
		}
	}
	return false;
}

function updatePf2t(core: TCore): boolean {
	const found = findPf2tCore(core);
	if (found) {
		if (stringify(core.pf2t) !== stringify(found)) {
			core.pf2t = found;
			clearStringify(core.id);
			return true;
		}
	}
	return false;
}

function processMissingSpells() {
	info(`\nChecking for missing spells ...`);
	const missing = pf2tCores.filter(pf2 => !sageCores.find(core => compareNames(core, pf2)));
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
	sageCores.forEach(core => {
		if (["Deity","Ancestry","VersatileHeritage"].includes(core.objectType)) {
			pushLore(`${core.name} Lore`, core.objectType);
		}
		const string = stringify(core);
		const lores = string.match(loreRegex);
		lores?.forEach(lore => pushLore(lore));
	});
	allLores.sort((a, b) => a.name === b.name ? 0 : a.name < b.name ? -1 : 1);
	fs.writeFileSync("./data/all-lores.csv", allLores.map(lore => `${lore.name},${lore.type ?? ""}`).join("\n"));
	info(`Creating all-lores.csv ... done!`);
}
//#endregion

function findDuplicateCores(): void {
	const dupes = sageCores.map(core => sageCores.filter(dupe =>
		core.objectType === dupe.objectType && core.name === dupe.name && core.source === dupe.source && core.id !== dupe.id
	)).filter(dupes => dupes.length);
	info(`Duplicate Entries (${dupes.length}): ${dupes.pluck("name" as any)}`);
}

let pf2tCores: Pf2tBaseCore[] = [];
export default async function process(): Promise<void> {

	await loadPf2tCores();
	processSources();
	await processPf2tData();
	processAbcData();
	processMissingSpells();
	processLore();
	findDuplicateCores();
	parsePf2Data();

	info(""); // spacer for bash script
}
