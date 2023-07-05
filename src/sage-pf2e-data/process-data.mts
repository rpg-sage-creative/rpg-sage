import { existsSync, readdirSync, rmSync } from "fs";
import type { THasSuccessOrFailure } from "../sage-pf2e/model/base/interfaces";
import { readJsonFileSync, writeFileSync } from "../sage-utils/FsUtils";
import { orNilUuid, type UUID } from "../sage-utils/UuidUtils";
import { DistDataPath, SrcDataPath, clearStringify, compareNames, debug, error, getPf2tCores, getSageCores, info, loadPf2tCores, log, stringify, warn } from "./common.mjs";
import { findPf2tCore, parsePf2Data } from "./pf2-tools-parsers/common.mjs";
import { processAbcData } from "./process-abc.mjs";
import { processPf2tData } from "./processPf2taData.mjs";
import type { TCore } from "./types.mjs";
import { randomUUID } from "crypto";

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
	do { uuid = randomUUID(); }while(!isUnique(uuid));
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
	const found = paths.find(path => existsSync(path));
	if (found) {
		sourcePaths.push(found);
	}else {
		debug(`  Not Parsing ${source.code} ${source.name}`);
	}
	return found;
}
function getFullPathOfAllJsonFilesIn(path?: string) {
	if (!path) { return []; }
	const names = readdirSync(path);
	const json = names.filter(name => name.endsWith(".json")).map(name => `${path}/${name}`);
	const subs = names.filter(name => !name.includes(".")).map(name => getFullPathOfAllJsonFilesIn(`${path}/${name}`));
	subs.forEach(sub => json.push(...sub));
	return json;
}
function getNonSourcePaths() {
	return readdirSync(SrcDataPath)
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
			const source = getSageCores().find(c => c.objectType === "Source" && c.code === core.source);
			if (!source) {
				warn(`\tInvalid source for ${core.objectType}:${core.name} (${core.source})`);
			}else if (!path.includes(source.code!) && !path.includes(source.name)) {
				warn(`\tWrong source for ${core.objectType}:${core.name} (${core.source})`);
			}
		}
	}
}
function validateAbbreviation(core: TCore) {
	if (core.objectType === "Source" && core.abbreviation && getSageCores().find(c => c !== core && c.objectType === "Source" && c.abbreviation === core.abbreviation)) {
		error(`\tDuplicate source abbreviation '${core.abbreviation}' for ${core.name}`);
	}
}
function pluralObjectType(objectType: string) { return `${objectType}s`.toLowerCase(); }
function updatePreviousId(core: TCore) {
	const sageCores = getSageCores();
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
	const coreList = readJsonFileSync(filePathAndName) as TCore[];

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
		rmSync(filePathAndName);
		const fileName = filePathAndName.split("/").pop();
		const coreSources = coreList.map(core => core.source).filter((s, i, a) => s && a.indexOf(s) === i);
		coreSources.forEach(src => {
			const srcCores = coreList.filter(core => core.source === src);
			const _filePathAndName = `${SrcDataPath}/${src}/${pluralObjectType(srcCores[0].objectType)}/${fileName}`;
			warn(`Moving ${srcCores.length} from ${filePathAndName} to ${_filePathAndName}`)
			writeFileSync(_filePathAndName, srcCores, true, true);
			processData(_filePathAndName);
		});
		return coreList;
	}
	//#endregion

	debug(`Parsing (${coreList.length}): ${filePathAndName}`);
	total += coreList.length;

	ensureTrait(coreList);
	ensureLanguage(coreList);

	for (const core of coreList) {
		getSageCores().push(core);
		if (!core.id) {
			core.id = createUuid();
			_created++;
		}else if (!isUnique(core.id)) {
			core.id = createUuid();
			_recreated++;
		}else {
			unique++;
			const normalized = orNilUuid(core.id);
			if (core.id !== normalized) {
				core.id = normalized
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
		writeFileSync(`${DistDataPath}/${core.objectType}/${core.id}.json`, core, true, false);
	}

	created += _created;
	recreated += _recreated;
	normalized += _normalized;
	aoned += _aoned;
	linked += _linked;
	if (_created || _recreated || _normalized || _aoned || _linked || updateFile) {
		info(`\tSaving ${_created} IDs created, ${_recreated} IDs recreated, ${_normalized} IDs normalized, ${_aoned} aonIDs set, and ${_linked} links set`);
		writeFileSync(filePathAndName, coreList, false, true);
	}
	// info(`Processing file: ${filePathAndName} ... done`);
	return coreList;
}

function missingObjectType(coreList: TCore[], typesToCheck: string[], typeToFind: string, pf2tType: string = typeToFind.toLowerCase()): TCore[] {
	const pf2tCores = getPf2tCores();
	const missing = coreList.filter(sage => typesToCheck.includes(sage.objectType) && !coreList.find(core => core.objectType === typeToFind && core.name === sage.name));
	return missing.filter(sage => pf2tCores.find(pf2t => pf2t.type === pf2tType && sage.name === pf2t.name));
}
function ensureTrait(coreList: TCore[]): void {
	const objectTypes = ["Class","Ancestry","Archetype","VersatileHeritage"];
	const missingTraits = missingObjectType(coreList, objectTypes, "Trait");
	missingTraits.forEach(sage => {
		const core = { objectType:"Trait", name:sage.name, source:sage.source, id:createUuid() } as TCore;
		coreList.splice(coreList.indexOf(sage) + 1, 0, core);
	});
}
function ensureLanguage(coreList: TCore[]): void {
	if (coreList[0]?.source === "PZO2101") return;
	const objectTypes = ["Ancestry", "Heritage", "VersatileHeritage"];
	const missingLanguages = missingObjectType(coreList, objectTypes, "Language");
	missingLanguages.forEach(sage => {
		const core = { objectType:"Language", name:sage.name, source:sage.source, id:createUuid() } as TCore;
		coreList.splice(coreList.indexOf(sage) + 1, 0, core);
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
	const sageCores = getSageCores();
	const pf2tCores = getPf2tCores();
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
	info(`\nCreating all-lores.csv ...`);
	const loreRegex = /([A-Z]\w+\s+)+Lore/g;
	getSageCores().forEach(core => {
		if (["Deity","Ancestry","VersatileHeritage"].includes(core.objectType)) {
			pushLore(`${core.name} Lore`, core.objectType);
		}
		const string = stringify(core);
		const lores = string.match(loreRegex);
		lores?.forEach(lore => pushLore(lore));
	});
	allLores.sort((a, b) => a.name === b.name ? 0 : a.name < b.name ? -1 : 1);
	writeFileSync("./data/all-lores.csv", allLores.map(lore => `${lore.name},${lore.type ?? ""}`).join("\n"));
	info(`Creating all-lores.csv ... done!`);
}
//#endregion

function findDuplicateCores(): void {
	const sageCores = getSageCores();
	const dupes = sageCores.map(core => sageCores.filter(dupe =>
		core.objectType !== "Feat" && core.objectType === dupe.objectType && core.name === dupe.name && core.source === dupe.source && core.id !== dupe.id
	)).filter(dupes => dupes.length);
	info(`Duplicate Entries (${dupes.length}): ${dupes.map(list => list[0]!.name)}`);
}

function processDomainSpells(): void {
	info(`\nChecking domain spells ...`);
	const sageCores = getSageCores();
	const domains = sageCores.filter(core => core.objectType === "Domain");
	const focusSpells = sageCores.filter(core => core.objectType === "FocusSpell");
	let missingSpells = 0;
	domains.forEach(domain => {
		const missing = domain.spells?.filter(spellName => !focusSpells.find(spell => spell.name.toLowerCase() === spellName.toLowerCase() && spell.domain?.toLowerCase() === domain.name.toLowerCase()));
		if (missing?.length) {
			missingSpells += missing.length;
			info(`\tDomain (${domain.name}) spells missing: ${missing.join(", ")}`);
		}
	});
	let missingDomains = 0;
	focusSpells.forEach(spell => {
		if (spell.domain && !domains.find(domain => domain.name.toLowerCase() === spell.domain?.toLowerCase() && domain.spells?.map(s => s.toLowerCase()).includes(spell.name.toLowerCase()))) {
			missingDomains++;
			info(`\tFocusSpell (${spell.name}) domain missing: ${spell.domain}`);
		}
	});
	info(`Checking domain spells ... ${missingSpells} missing spells; ${missingDomains} missing domains`);
}

export async function process(): Promise<void> {

	await loadPf2tCores();
	processSources();
	await processPf2tData();
	processAbcData();
	processMissingSpells();
	processDomainSpells();
	processLore();
	if (false)
	findDuplicateCores();
	if (false)
	parsePf2Data();

	info(""); // spacer for bash script
}
