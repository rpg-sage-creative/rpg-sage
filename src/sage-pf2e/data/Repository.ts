import utils, { isDefined, Optional, OrNull, OrUndefined, TUuidMatcher, UUID } from "../../sage-utils";
import type { TEntity } from "../model";
import type Base from "../model/base/Base";
import type { BaseCore } from "../model/base/Base";
import type HasSource from "../model/base/HasSource";
import type Source from "../model/base/Source";
import type Creature from "../model/bestiary/Creature";
import Pf2ToolsData from "./Pf2ToolsData";
import SearchResults from "./SearchResults";

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

export function getObjectTypes(): string[] {
	return Array.from(repoMap.keys());
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
		return <T>all<HasSource>(objectType, <string>sourceOrPredicate).find(<BaseFilterCallbackFn<HasSource>>predicate);
	}
	return <T>_all(objectType).find(<BaseFilterCallbackFn<Base>>sourceOrPredicate);
}

function _findById<T extends string, U extends TEntity<T> = TEntity<T>>(objectType: T, uuidMatcher: TUuidMatcher): OrUndefined<U> {
	return _all<U>(objectType).find(base => base.equals(uuidMatcher));
}

/** Finds the object for the given UUID. */
export function findById<T extends Base>(id: OrUndefined<UUID>): OrUndefined<T> {
	if (!id) {
		return undefined;
	}

	const uuidMatcher = utils.UuidUtils.UuidMatcher.from(id);
	if (uuidMatcher.isValid) {
		for (const objectType of repoMap.keys()) {
			const found = _findById(objectType, uuidMatcher);
			if (found) {
				return <T>found;
			}
		}
	}

	console.info(`findById(${uuidMatcher.value}) not found!`);
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

/** Returns the first object found from the given list. */
export function first<T extends Base>(objectIds: string[]): OrUndefined<T>;
export function first<T extends string>(objectType: T, objectNames: string[]): OrUndefined<TEntity<T>>;
export function first<T extends Base>(objectIdsOrType: string | string[], objectNames?: string[]): OrUndefined<T> {
	if (Array.isArray(objectNames)) {
		for (const objectName of objectNames) {
			const found = findByValue(<string>objectIdsOrType, objectName);
			if (found) {
				return found as T;
			}
		}
	}else if (Array.isArray(objectIdsOrType)) {
		for (const objectId of objectIdsOrType) {
			const found = findById(objectId);
			if (found) {
				return found as T;
			}
		}
	}
	return undefined;
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
export function search<T extends Base>(searchInfo: utils.SearchUtils.SearchInfo, ...searchCategories: string[]): SearchResults<T> {
	const validObjectTypes = searchCategories.map(searchCategory => parseObjectType(searchCategory)?.objectType).filter(isDefined),
		objectTypesToSearch = validObjectTypes.length ? validObjectTypes : Array.from(repoMap.keys()).sort(),
		searchResultCategory = objectTypesToSearch.length === 1 ? objectTypeToSearchResultCategory(objectTypesToSearch[0]) : undefined,
		searchResults = new SearchResults<T>(searchInfo, searchResultCategory);
	if (!validObjectTypes.length && !searchInfo.globalFlag) {
		searchInfo.keyTerm = searchCategories.join(" ");
	}
	objectTypesToSearch.forEach(objectType => {
		_all<T>(objectType).forEach(object => {
			//TODO: Figure out why errata isn't being removed from the main lists; once tagged they shouldn't be searchable!
			if (!(<HasSource><any>object).hasErrata) {
				searchResults.add(...object.searchRecursive(searchInfo).filter(objectScore => objectScore.bool));
			}
		});
	});

	searchResults.add(...Pf2ToolsData.search<T>(searchInfo));

	// #region perfect match resort
	const stringMatcher = utils.StringUtils.StringMatcher.from(searchInfo.searchText);
	const nameMatches = searchResults.scores.filter(score => score.searchable.matches(stringMatcher));
	if (nameMatches.length) {
		searchResults.scores = nameMatches.concat(searchResults.scores.filter(score => !nameMatches.includes(score)));
	}
	// #endregion

	return searchResults;
}
export function searchComparison<T extends Base>(searchInfo: utils.SearchUtils.SearchInfo, ...searchCategories: string[]): SearchResults<T> {
	const validObjectTypes = searchCategories
		.map(searchCategory => parseObjectType(searchCategory))
		.filter(searchCategory => searchCategory)
		.map(searchCategory => searchCategory!.objectType);
	const objectTypesToSearch = validObjectTypes.length ? validObjectTypes : Array.from(repoMap.keys()).sort();
	const searchResultCategory = objectTypesToSearch.length === 1 ? objectTypeToSearchResultCategory(objectTypesToSearch[0]) : undefined;
	const searchResults = new SearchResults<T>(searchInfo, searchResultCategory);
	if (!validObjectTypes.length && !searchInfo.globalFlag) {
		searchInfo.keyTerm = searchCategories.join(" ");
	}
	const options = { toString: (item: Base) => item.name, includeThreshold: 0.1, excludeThreshold: 0.2, ignoreCase: true };
	const _allObjects: T[] = [];
	objectTypesToSearch.forEach(objectType => _allObjects.push(...all<T>(objectType)));
	const items = utils.StringUtils.Comparison.rank(_allObjects, searchInfo.searchText, options);
	searchResults.add(...items.map(item => new utils.SearchUtils.SearchScore(item.item, item.jar)));

	// #region perfect match resort
	const stringMatcher = utils.StringUtils.StringMatcher.from(searchInfo.searchText);
	const nameMatches = searchResults.scores.filter(score => score.searchable.matches(stringMatcher));
	if (nameMatches.length) {
		searchResults.scores = nameMatches.concat(searchResults.scores.filter(score => !nameMatches.includes(score)));
	}
	// #endregion

	return searchResults;
}
export function searchBySource<T extends HasSource>(objectType: string, searchInfo: utils.SearchUtils.SearchInfo, source: Source): T[] {
	if (!source) {
		if (!searchInfo) {
			return all<T>(objectType);
		}
		return all<T>(objectType).filter(item => item.search(searchInfo));
	}
	if (!searchInfo) {
		return filter(objectType, item => item.source === source);
	}
	// TODO: Is this needed? --> if (!repo[objectType]) { console.warn(`Searching an objectType that isn't loaded: ${objectType}`); }
	return all<T>(objectType).filter(item => item.source === source && item.search(searchInfo));
}

//#region load data

const missing: string[] = [];

export function loadData(dataPath: string, includePf2ToolsData = false): Promise<void> {
	const distPath = `${dataPath}/dist`.replace(/\/+/g, "/");
	return loadDataFromDist(distPath).then(() => {
		if (includePf2ToolsData) {
			return Pf2ToolsData.load(dataPath);
		}
		return Promise.resolve();
	});
}

function handleMissingObjectType(objectType: string, fromLabel: string): void {
	if (!missing.includes(objectType)) {
		missing.push(objectType);
		console.warn(`Missing parser for "${objectType}" from "${fromLabel}"`);
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
		handleMissingObjectType(objectType, fromLabel);
		return 0;
	}
	const repoItem = repoMap.get(objectType);
	if (!repoItem) {
		handleMissingObjectType(objectType, fromLabel);
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

//#endregion
