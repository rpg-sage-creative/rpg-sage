import utils, { isDefined, Optional, OrNull, OrUndefined, TUuidMatcher, UUID } from "../../sage-utils";
import type { TEntity } from "../model";
import type Base from "../model/base/Base";
import type { BaseCore } from "../model/base/Base";
import type HasSource from "../model/base/HasSource";
import Source from "../model/base/Source";
import type Creature from "../model/bestiary/Creature";
import Pf2tBase, { type Pf2tBaseCore } from "../model/base/Pf2tBase";
import SearchResults from "./SearchResults";
import type { SourceCore } from "../model/base/Source";
import type AonBase from "../model/base/AonBase";

export type TObjectTypeAndPlural = { objectType: string; objectTypePlural: string; };

export interface IFile { filename: string; label: string; }
export type BaseFilterCallbackFn<T extends Base> = (value: T, index: number, array: T[]) => boolean;

type TRepositoryItem = {
	constructor: typeof Base;
	objectType: string;
	objectTypeLower: string;
	objectTypePlural: string;
	objectTypePluralLower: OrUndefined<string>;
	objects: Base[];
	erratad: Base[];
};
const repoMap: Map<string, TRepositoryItem> = new Map();

/** Used to find a properly cased objectType from any objectType or objectTypePlural */
export function parseObjectType(objectType: string): OrNull<TObjectTypeAndPlural> {
	const objectTypeLower = String(objectType).toLowerCase();
	const repoItem = Array.from(repoMap.values())
		.find(_repoItem => _repoItem.objectTypeLower === objectTypeLower || _repoItem.objectTypePluralLower === objectTypeLower);
	if (!repoItem) {
		return null;
	}
	return {
		objectType: repoItem.objectType,
		objectTypePlural: repoItem.objectTypePlural
	};
}
/** Creates a RepositoryItem for the given constructor */
export function registerObject<T = any>(itemConstructor: T): void;
export function registerObject(itemConstructor: typeof Base): void {
	const objectType = itemConstructor.singular,
		objectTypePlural = itemConstructor.plural;
	repoMap.set(objectType, {
		objectType: objectType,
		objectTypeLower: objectType.toLowerCase(),
		objectTypePlural: objectTypePlural,
		objectTypePluralLower: objectTypePlural?.toLowerCase(),
		constructor: itemConstructor,
		objects: [],
		erratad: []
	});
	console.info(`Registering Object #${repoMap.size}: ${objectType}`);
}

/** Returns the objectType values (sorted) currently loaded. */
export function getObjectTypes(): string[] {
	return Array.from(repoMap.keys()).sort();
}

function _all<T extends Base>(objectType: string): T[] {
	return <T[]>repoMap.get(objectType)?.objects ?? [];
}

/** Returns all objects for the given objectType. */
export function all<T extends string, U extends TEntity<T> = TEntity<T>>(objectType: T): U[];
/** Returns all objects for the given objectType. */
export function all<T extends Base>(objectType: string): T[];
/** Returns all objects for the given objectType with a matching Source. */
export function all<T extends HasSource>(objectType: string, source: string): T[];
export function all(objectType: string, source?: string): Base[] {
	const items = _all(objectType);
	if (source) {
		const stringMatcher = utils.StringUtils.StringMatcher.from(source);
		return (<HasSource[]>items).filter((item: HasSource) => item.source?.matches(stringMatcher));
	}
	return items.slice();
}

export function filter<T extends string, U extends TEntity<T> = TEntity<T>>(objectType: T, callbackfn: BaseFilterCallbackFn<U>): U[] {
	return _all<U>(objectType).filter(callbackfn);
}

export function find(objectType: "Source", predicate: BaseFilterCallbackFn<Source>): OrUndefined<Source>;
export function find<T extends Base>(objectType: string, predicate: BaseFilterCallbackFn<T>): OrUndefined<T>;
export function find<T extends HasSource>(objectType: string, source: OrUndefined<string>, predicate: BaseFilterCallbackFn<T>): OrUndefined<T>;
export function find<T extends Base | HasSource>(objectType: string, sourceOrPredicate: string | BaseFilterCallbackFn<T> | undefined, predicate?: BaseFilterCallbackFn<T>): OrUndefined<T> {
	if (predicate) {
		return all<HasSource>(objectType, <string>sourceOrPredicate).find(<BaseFilterCallbackFn<HasSource>>predicate) as T;
	}
	return _all(objectType).find(<BaseFilterCallbackFn<Base>>sourceOrPredicate) as T;
}

function _findById<T extends string, U extends TEntity<T> = TEntity<T>>(objectType: T, uuidMatcher: TUuidMatcher): OrUndefined<U> {
	return _all<U>(objectType).find(base => base.equals(uuidMatcher));
}

export function findByAonBase<T extends Base | HasSource>(aonBase: AonBase): OrUndefined<T> {
	const objectTypes = getObjectTypes();
	for (const objectType of objectTypes) {
		const found = find(objectType, base => aonBase.matchesBase(base));
		if (found) {
			return found as T;
		}
	}
	return undefined;
}

/** Finds the object for the given UUID. */
export function findById<T extends Base>(id: OrUndefined<UUID>): OrUndefined<T> {
	const uuidMatcher = id ? utils.UuidUtils.UuidMatcher.from(id) : null;
	if (uuidMatcher?.isValid) {
		for (const objectType of getObjectTypes()) {
			const found = _findById(objectType, uuidMatcher);
			if (found) {
				return <T>found;
			}
		}
	}
	console.info(`findById(${uuidMatcher?.value ?? id}) not found!`);
	return undefined;
}

/** Finds an object of the given objectType that has a UUID or Name that matches the given value. */
export function findByValue(objectType: "Creature", value: UUID): OrUndefined<Creature>;
export function findByValue(objectType: "Source", value: UUID): Source;
export function findByValue<T extends string>(objectType: T, value: Optional<UUID>): OrUndefined<TEntity<T>>;
export function findByValue<T extends Base<any>>(objectType: string, value: Optional<UUID>): OrUndefined<T> {
	if (!value) {
		return undefined;
	}

	const uuidMatcher = utils.UuidUtils.UuidMatcher.from(value);
	if (uuidMatcher.isValid) {
		return _findById(objectType, uuidMatcher);
	}

	const stringMatcher = utils.StringUtils.StringMatcher.from(value);
	if (stringMatcher.isBlank) {
		return undefined;
	}

	return _all<T>(objectType).find(base => base.matches(stringMatcher));
}

/** Returns a random object for the given objectType. If a predicate is given, the objects are filtered before selection. */
export function random<T extends string>(objectType: T): TEntity<T>;
export function random<T extends Base>(objectType: string, predicate: BaseFilterCallbackFn<T>): T;
export function random<T extends Base>(objectType: string, predicate?: BaseFilterCallbackFn<T>): T {
	const objects: T[] = all(objectType);
	return utils.RandomUtils.randomItem(predicate ? objects.filter(predicate) : objects)!;
}

function objectTypeToSearchResultCategory(objectType: string): string {
	const meta = repoMap.get(objectType),
		objects = meta?.objects,
		firstObject = objects?.[0];
	return firstObject?.searchResultCategory ?? objectType;
}

type TSearchHandler<T extends Base> = (objectTypesToSearch: string[], searchResults: SearchResults<T>) => void;
function _search<T extends Base>(searchInfo: utils.SearchUtils.SearchInfo, searchCategories: string[], handler: TSearchHandler<T>): SearchResults<T> {
	const validObjectTypes = searchCategories.map(searchCategory => parseObjectType(searchCategory)?.objectType).filter(isDefined);
	const objectTypesToSearch = validObjectTypes.length ? validObjectTypes : getObjectTypes();
	const searchResultCategory = objectTypesToSearch.length === 1 ? objectTypeToSearchResultCategory(objectTypesToSearch[0]) : undefined;
	const searchResults = new SearchResults<T>(searchInfo, searchResultCategory);
	if (!validObjectTypes.length && !searchInfo.globalFlag) {
		searchInfo.keyTerm = searchCategories.join(" ");
	}

	handler(objectTypesToSearch, searchResults);

	// #region perfect match resort
	const stringMatcher = utils.StringUtils.StringMatcher.from(searchInfo.searchText);
	const nameMatches = searchResults.scores.filter(score => score.searchable.matches(stringMatcher));
	if (nameMatches.length) {
		searchResults.scores = nameMatches.concat(searchResults.scores.filter(score => !nameMatches.includes(score)));
	}
	// #endregion

	return searchResults;
}
export function search<T extends Base>(searchInfo: utils.SearchUtils.SearchInfo, ...searchCategories: string[]): SearchResults<T> {
	return _search(searchInfo, searchCategories, (objectTypesToSearch, searchResults) => {
		objectTypesToSearch.forEach(objectType => {
			_all<T>(objectType).forEach(object => {
				//TODO: Figure out why errata isn't being removed from the main lists; once tagged they shouldn't be searchable!
				if (!(<HasSource><any>object).hasErrata) {
					searchResults.add(...object.searchRecursive(searchInfo).filter(objectScore => objectScore.bool));
				}
			});
		});
	});
}
export function searchComparison<T extends Base>(searchInfo: utils.SearchUtils.SearchInfo, ...searchCategories: string[]): SearchResults<T> {
	return _search(searchInfo, searchCategories, (objectTypesToSearch, searchResults) => {
		const options = { toString: (item: Base) => item.name, includeThreshold: 0.1, excludeThreshold: 0.2, ignoreCase: true };
		const _allObjects: T[] = [];
		objectTypesToSearch.forEach(objectType => _allObjects.push(...all<T>(objectType)));
		const items = utils.StringUtils.Comparison.rank(_allObjects, searchInfo.searchText, options);
		searchResults.add(...items.map(item => new utils.SearchUtils.SearchScore(item.item, item.jar)));
	});
}

//#region load data

const missing: string[] = [];

export function loadData(dataPath: string, includePf2ToolsData = false): Promise<void> {
	const distPath = `${dataPath}/dist`.replace(/\/+/g, "/");
	return loadDataFromDist(distPath).then(() => {
		if (includePf2ToolsData) {
			return loadFromPF2t(distPath);
		}
		return Promise.resolve();
	});
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
function parseChildren(core: BaseCore, fromLabel: string, itemConstructor: typeof Base): number {
	if (itemConstructor.childParser) {
		let childrenLoaded = 0;
		const childCores = itemConstructor.childParser(core) ?? [];
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
	const repoItem = repoMap.get(objectType);
	if (!repoItem) {
		handleMissingObjectType(core, fromLabel);
		return 0;
	}

	const itemConstructor = repoItem.constructor;
	const childrenParsed = parseChildren(core, fromLabel, itemConstructor);
	const entity: HasSource = new itemConstructor(core) as HasSource;
	if (entity.isErrata) {
		const index = repoItem.objects.findIndex(o => o.id === entity.previousId);
		const isRemoved = entity.version < 0;
		if (isRemoved) {
			if (-1 < index) {
				repoItem.erratad.push(...repoItem.objects.splice(index, 1));
			}
		} else {
			if (index < 0) {
				repoItem.objects.push(entity);
			} else {
				repoItem.erratad.push(...repoItem.objects.splice(index, 1, entity));
			}
		}
	} else {
		repoItem.objects.push(entity);
	}
	return 1 + childrenParsed;
}

async function loadDataFromDist(distPath: string): Promise<void> {
	const files: string[] = await utils.FsUtils.filterFiles(distPath, file => file.endsWith(".json"), true)
		.catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray);
	if (!files.length) {
		console.warn(`No files in "${distPath}" ...`);
		return Promise.resolve();
	}

	let coresLoaded = 0;

	const sources = files.filter(file => file.includes("/Source/"));
	console.info(`Loading Data: ${sources.length} sources`);
	for (const source of sources) {
		await utils.FsUtils.readJsonFile<BaseCore>(source).then(core => coresLoaded += loadCore(core, source), console.warn);
	}

	const others = files.filter(file => !file.includes("/Source/"));
	console.info(`Loading Data: ${others.length} objects`);
	for (const other of others) {
		await utils.FsUtils.readJsonFile<BaseCore>(other).then(core => coresLoaded += loadCore(core, other), console.warn);
	}

	console.info(`\t\t${coresLoaded} Total Cores loaded`);

	return Promise.resolve();
}

async function loadFromPF2t(distPath: string): Promise<void> {
	const pathAndFile = `${distPath}/pf2t-leftovers.json`;
	const cores = await utils.FsUtils.readJsonFile<Pf2tBaseCore[]>(pathAndFile).catch(() => null) ?? [];
	console.info(`\t\t${cores.length} Total PF2 Tools Cores loaded`);
	cores.forEach(core => {
		const data = new Pf2tBase(core);
		if (!repoMap.has(data.objectType)) {
			repoMap.set(data.objectType, {
				constructor: null!,
				objectType: data.objectType,
				objectTypeLower: data.objectType.toLowerCase(),
				objectTypePlural: data.objectType + "s",
				objectTypePluralLower: data.objectType.toLowerCase() + "s",
				objects: [],
				erratad: []
			});
		}
		repoMap.get(data.objectType)!.objects.push(data);
	});
}

//#endregion

//#region Parsing AoN Source strings

const missingSources: string[] = [];

export type TParsedSource = { name:string; source?:Source; page:number; version?:string; };
type TSourceOrCore = Source | SourceCore;

function matchSourceNames(a: string, b: string): boolean {
	return a === b
		|| a.replace(/-/g, " ") === b.replace(/-/g, " ")
		|| a.replace(/Shadows$/, "Shadow") === b.replace(/Shadows$/, "Shadow")
		|| a.replace(/Pathfinder Society Guide/, "PFS Guide") === b.replace(/Pathfinder Society Guide/, "PFS Guide");
}

function matchSourceByName(cores: TSourceOrCore[], name: string): TSourceOrCore | undefined {
	return cores.find(core => matchSourceNames(core.name, name));
}

function matchSourceByApName(cores: TSourceOrCore[], name: string): TSourceOrCore | undefined {
	return cores.find(core => matchSourceNames(`${core.apNumber} ${core.name}`, name));
}

function matchSourceByProductLineName(cores: TSourceOrCore[], name: string): TSourceOrCore | undefined {
	return cores.find(core => matchSourceNames(core.name, `${core.productLine}: ${name}`))
		?? cores.find(core => matchSourceNames(core.name, `${core.productLine}: The ${name}`));
}

function matchSource(sources: TSourceOrCore[], name: string): Source | undefined {
	const match = matchSourceByName(sources, name)
		?? matchSourceByProductLineName(sources, name)
		?? matchSourceByApName(sources, name);
	if (match) {
		return match instanceof Source ? match : new Source(match);
	}
	return undefined;
}

export function parseSource(value?: string, sources?: TSourceOrCore[]): TParsedSource | null {
	// "source": "Core Rulebook pg. 283 2.0",
	const parts = value?.match(/^(.*?) pg. (\d+)(?: \d+\.\d+)?$/);
	if (!parts) {
		// console.log(value, sources?.map(src => src.name));
		return null;
	}

	const name = parts[1];
	const page = +parts[2];
	const version = parts[3];

	if (!(sources?.length)) {
		sources = all<Source>("Source");
	}

	const source = matchSource(sources, name);
	if (!source && !missingSources.includes(name)) {
		missingSources.push(name);
		console.log(`Unknown Source: ${name}`);
		return null;
	}

	return { source, name, page, version };
}
export function parseSources(value?: string, sources?: TSourceOrCore[]): TParsedSource[] {
	const values = value?.split(/\s*,\s*/) ?? [];
	return values
		.map(value => parseSource(value, sources))
		.filter(isDefined);
}

//#endregion
