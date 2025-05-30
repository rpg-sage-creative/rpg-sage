import type { Matcher, Optional, OrNull, OrUndefined } from "@rsc-utils/core-utils";
import { debug, errorReturnEmptyArray, getDataRoot, initializeNoiseUS, initializeUKtoUS, isDefined, SnowflakeMatcher, StringMatcher, UuidMatcher, verbose, warn } from "@rsc-utils/core-utils";
import { randomItem } from "@rsc-utils/dice-utils";
import { filterFiles, readJsonFile } from "@rsc-utils/io-utils";
import type { AonBase } from "../model/base/AonBase.js";
import type { Base, BaseCore } from "../model/base/Base.js";
import type { HasSource } from "../model/base/HasSource.js";
import type { SourceCore } from "../model/base/Source.js";
import { Source } from "../model/base/Source.js";
import type { Creature } from "../model/bestiary/Creature.js";
import type { TEntity } from "../model/index.js";

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
		if (/s?$/.test(objectType)) {
			return {
				objectType: objectType.slice(0, -1),
				objectTypePlural: objectType
			};
		}
		return {
			objectType,
			objectTypePlural: objectType + "s"
		};
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
	verbose(`Registering Object #${repoMap.size}: ${objectType}`);
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
		const stringMatcher = StringMatcher.from(source);
		return (<HasSource[]>items).filter((item: HasSource) => item.source?.matches(stringMatcher));
	}
	return items.slice();
}

export function filter<T extends string, U extends TEntity<T> = TEntity<T>>(objectType: T, callbackfn: BaseFilterCallbackFn<U>): U[] {
	return _all<any>(objectType).filter(callbackfn);
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

function _findById<T extends string, U extends TEntity<T> = TEntity<T>>(objectType: T, matcher: Matcher): OrUndefined<U> {
	return _all<any>(objectType).find(base => base.equals(matcher));
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
export function findById<T extends Base>(id: OrUndefined<string>): OrUndefined<T> {
	if (id) {
		const uuidMatcher = UuidMatcher.from(id);
		if (uuidMatcher.isValid) {
			for (const objectType of getObjectTypes()) {
				const found = _findById(objectType, uuidMatcher);
				if (found) {
					return <T>found;
				}
			}
			verbose(`findById(${uuidMatcher?.value ?? id}) not found!`);
		}else {
			const snowflakeMatcher = SnowflakeMatcher.from(id);
			if (snowflakeMatcher.isValid) {
				for (const objectType of getObjectTypes()) {
					const found = _findById(objectType, snowflakeMatcher);
					if (found) {
						return <T>found;
					}
				}
				verbose(`findById(${snowflakeMatcher?.value ?? id}) not found!`);
			}
		}
	}else {
		verbose(`findById(${id}) not found!`);
	}
	return undefined;
}

/** Finds an object of the given objectType that has a ID or Name that matches the given value. */
export function findByValue(objectType: "Creature", value: string): OrUndefined<Creature>;
export function findByValue(objectType: "Source", value: string): Source;
export function findByValue<T extends string>(objectType: T, value: Optional<string>): OrUndefined<TEntity<T>>;
export function findByValue<T extends Base<any>>(objectType: string, value: Optional<string>): OrUndefined<T> {
	if (!value) {
		return undefined;
	}

	const uuidMatcher = UuidMatcher.from(value);
	if (uuidMatcher.isValid) {
		return _findById(objectType, uuidMatcher);
	}

	const snowflakeMatcher = SnowflakeMatcher.from(value);
	if (snowflakeMatcher.isValid) {
		return _findById(objectType, snowflakeMatcher);
	}

	const stringMatcher = StringMatcher.from(value);
	if (!stringMatcher.isNonNil) {
		return undefined;
	}

	return _all<T>(objectType).find(base => base.matches(stringMatcher));
}

/** Returns a random object for the given objectType. If a predicate is given, the objects are filtered before selection. */
export function random<T extends string>(objectType: T): TEntity<T>;
export function random<T extends Base>(objectType: string, predicate: BaseFilterCallbackFn<T>): T;
export function random<T extends Base>(objectType: string, predicate?: BaseFilterCallbackFn<T>): T {
	const objects: T[] = all(objectType);
	return randomItem(predicate ? objects.filter(predicate) : objects)!;
}

//#region load data

const missing: string[] = [];

function handleMissingObjectType(core: BaseCore, fromLabel: string): void {
	if (!missing.includes(core.objectType)) {
		missing.push(core.objectType);
		warn(`Missing parser for "${core.objectType}" from "${fromLabel}" ("${core.name}")`);
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
				warn(`Error parsing child core!`, core, childCore);
			}
			childrenLoaded += loaded;
		});
		return childrenLoaded;
	}
	return 0;
}

function loadCore(core: Optional<BaseCore>, fromLabel: string): number {
	if (!core) {
		warn(`Invalid core from "${fromLabel}": ${core}`);
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

export async function loadData(): Promise<void> {
	const pf2DataPath = `${getDataRoot("pf2e")}`.replace(/\/+/g, "/");
	const files: string[] = await filterFiles(pf2DataPath, file => file.endsWith(".json"), true)
		.catch(errorReturnEmptyArray);
	if (!files.length) {
		warn(`No files in "${pf2DataPath}" ...`);
		return Promise.resolve();
	}

	verbose(`Loading Data from: ${pf2DataPath}`);

	let coresLoaded = 0;

	const sources = files.filter(file => file.includes("/Source/"));
	verbose(`Loading Data: ${sources.length} sources`);
	for (const source of sources) {
		await readJsonFile<BaseCore>(source).then(core => coresLoaded += loadCore(core, source), warn);
	}

	const others = files.filter(file => !file.includes("/Source/"));
	verbose(`Loading Data: ${others.length} objects`);
	for (const other of others) {
		await readJsonFile<BaseCore>(other).then(core => coresLoaded += loadCore(core, other), warn);
	}

	verbose(`\t\t${coresLoaded} Total Cores loaded`);

	const pairs = initializeUKtoUS();
	verbose(`UK to US pairs loaded: ${pairs}`);

	const noise = initializeNoiseUS();
	verbose(`US noise words loaded: ${noise}`);

	return Promise.resolve();
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
		// debug(value, sources?.map(src => src.name));
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
		debug(`Unknown Source: ${name}`);
		return null;
	}

	return { source, name, page, version };
}
export function parseSources(value?: string | string[], sources?: TSourceOrCore[]): TParsedSource[] {
	const values = Array.isArray(value)
		? value
		: value?.split(/\s*,\s*/) ?? [];
	return values
		.map(val => parseSource(val, sources))
		.filter(isDefined);
}

//#endregion
