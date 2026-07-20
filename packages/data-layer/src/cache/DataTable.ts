import { error, errorReturnEmptyArray, errorReturnFalse, errorReturnUndefined, formatDataFilePath, getCodeName, getDataRoot, partition, tagLiterals, warnReturnUndefined, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { deleteFile, fileExists, filterFiles, readJsonFile, readJsonFileSync, readText, writeFile } from "@rsc-utils/io-utils";
import { join } from "node:path";
import { ensureNonNilId } from "./internal/ensureNonNilId.js";
import { getJsonPath } from "./internal/getJsonPath.js";
import { getPopulateHandler, type PopulateHandler } from "./internal/getPopulateHandler.js";
import { getReadHandler, type ReadHandler } from "./internal/getReadHandler.js";
import { getWriteHandler, type WriteHandler } from "./internal/getWriteHandler.js";
import { simplifyCacheItem, simplifyForLogging } from "./internal/simplify.js";
import { objectTypeToTableName, type BaseCacheItem, type CacheItemObjectType, type CharacterCacheItem, type DataMode, type GameCacheItem } from "./types.js";

type DataTableConfigItem = {
	/** default: "file" */
	dataMode?: DataMode;
	/** default: getCodeName() === "dev" */
	formatFiles?: boolean;
	/** default: objectType !== "Message" */
	isCached?: boolean;

	objectType: CacheItemObjectType;
	tableName?: string;
};

type UncachedDataTable<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>
> = {
	tableName: string;
	fetch<Core extends CacheItem>(item: CacheItem): Promise<Core | undefined>;
	write<Core extends CacheItem>(core: Core): Promise<boolean>;
};

type CachedDataTable<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>
> = UncachedDataTable<ObjectType, CacheItem> & {
	filter<CacheItem>(predicate: (item: CacheItem) => unknown): CacheItem[];
	find<CacheItem>(predicate: (item: CacheItem) => unknown): CacheItem | undefined;
	get(id: string | CacheItem): CacheItem | undefined;
	has(id: string | CacheItem): boolean;
	populate(): Promise<boolean>;
};

/**
 * Represents a cache for a specific ObjectType, as specified by ObjectCache.key
 */
export class DataTable<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
> {

	//#region instance

	/** stores each item by id, did, and uuid */
	private itemMap?: Map<string, CacheItem>;

	/** stores each item once */
	private itemSet?: Set<CacheItem>;

	public readonly dataMode: DataMode;

	public readonly formatFiles: boolean

	/** true if this DataTable is a CachedDataTable */
	public readonly isCached: boolean;

	public readonly objectType: ObjectType;

	public readonly populateHandler: PopulateHandler<ObjectType>;

	public readonly readHandler: ReadHandler<CacheItem>;

	public readonly tableName: string;

	public wasPopulated: boolean;

	private readonly writeHandler: WriteHandler<ObjectType>;

	private constructor(
		{ dataMode, formatFiles, isCached, objectType, tableName }: Required<DataTableConfigItem>,
	) {
		this.dataMode = dataMode;
		this.formatFiles = formatFiles;
		this.isCached = isCached;
		this.objectType = objectType as ObjectType;
		this.populateHandler = getPopulateHandler(dataMode);
		this.readHandler = getReadHandler(dataMode);
		this.tableName = tableName;
		this.wasPopulated = false;
		this.writeHandler = getWriteHandler(dataMode);
	}

	/**
	 * Fetches the cached item from source (ddb/file).
	 */
	public async fetch<Core extends CacheItem>(item: CacheItem): Promise<Core | undefined> {
		if (!item.id && !item.did && !item.uuid) {
			error(tagLiterals`GlobalCache.ObjectCache.fetch(${this.tableName}, ${simplifyForLogging(item)})`);
			return undefined;
		}

		const core = await this.readHandler(this.objectType, item);
		return core as Core;
	}

	/**
	 * Uses .fetch() to get the object fresh from the data source (.fetch adheres to DataMode).
	 * Creates a simplified CacheItem of the object and caches it with .put().
	 * If the fetch failed to return a core, then .remove(item.id) is called.
	 */
	public async fetchAndCache<Core extends CacheItem>(item: CacheItem): Promise<Core | undefined> {
		const core = await this.fetch<Core>(item);

		if (core) {
			this.put(core);

		}else {
			this.remove(item.id);
		}

		return core;
	}

	/**
	 * Returns the in memory globally cached BaseCacheItem array that matches the filter.
	 * It is expected that if you need an instance of the item that you will use ObjectCache.fetch().
	*/
	public filter<Core extends CacheItem>(predicate: (core: Core) => unknown): CacheItem[] {
		const filtered: CacheItem[] = [];

		// ensure we populated the set
		if (this.wasPopulated) {

			const items = this.itemSet!;

			for (const item of items) {
				if (predicate(item as Core)) {
					filtered.push(item);
				}
			}

		}

		return filtered;
	}

	/**
	 * Returns the in memory globally cached BaseCacheItem that matches the filter.
	 * It is expected that if you need an instance of the item that you will use ObjectCache.fetch().
	*/
	public find<Core extends CacheItem>(predicate: (core: Core) => unknown): CacheItem | undefined {
		// ensure we populated the set
		if (this.wasPopulated) {

			const items = this.itemSet!;

			for (const item of items) {
				if (predicate(item as Core)) {
					return item;
				}
			}

		}

		return undefined;
	}

	/**
	 * Returns the in memory globally cached BaseCacheItem by id.
	 * It is expected that if you need an instance of the item that you will use ObjectCache.fetch().
	 */
	public get(id: string): CacheItem | undefined {
		return this.itemMap?.get(id);
	}

	public has(id: string): boolean {
		return this.itemMap?.has(id) === true;
	}

	/** Populates this cache by reading items by DataMode */
	public async populate(): Promise<boolean> {
		if (!this.isCached) {
			error(`Uncached DataTable cannot be populated: ${this.objectType}`);
			return false;
		}

		if (this.wasPopulated) {
			error(`DataTable.populate() already called: ${this.objectType}`);
			return false;
		}

		this.itemMap = new Map();
		this.itemSet = new Set();

		this.wasPopulated = await this.populateHandler(this);

		if (!this.wasPopulated) {
			delete this.itemMap;
			delete this.itemSet;
		}

		return this.wasPopulated;
	}

	public put<Core extends CacheItem>(core: Core): boolean {
		if (!this.isCached) return false;

		this.remove(core.id);

		const item = simplifyCacheItem<Core, CacheItem>(core);

		const { itemMap } = this;
		itemMap!.set(item.id, item);
		if (item.did) itemMap!.set(item.did, item);
		if (item.uuid) itemMap!.set(item.uuid, item);

		this.itemSet!.add(item);

		return true;
	}

	/**
	 * Attempts to remove the item in cache with the given id.
	 * @param id id of the item to remove
	 * @returns the item removed or undefined
	 */
	public remove(id: string): CacheItem | undefined {
		if (!this.isCached) return undefined;

		const item = this.get(id);
		if (!item) return undefined;

		const { itemMap } = this;
		itemMap!.delete(item.id);
		itemMap!.delete(item.did!);
		itemMap!.delete(item.uuid!);

		this.itemSet!.delete(item);

		return item;
	}

	/** Writes the item to the appropriate place by DataMode before doing a fetchAndCache() to refresh the cache. */
	public async write(item: CacheItem): Promise<boolean> {
		// ensure this item has an id
		if (!ensureNonNilId(item)) {
			error(tagLiterals`GlobalCache.ObjectCache.put(${this.tableName}): Missing id; ${simplifyForLogging(item)})`);
			return false;
		}

		// set the updatedTs; Dice and Message are "one and done"
		if (item.objectType !== "Dice" && item.objectType !== "Message") {
			item.updatedTs = Date.now();
		}

		const saved = await this.writeHandler(this, item);

		if (!saved) {
			return false;
		}

		if (!this.isCached) {
			return true;
		}

		// puts the updated item in cache (.put will remove an existing item)
		return this.put(item);
	}

	//#endregion

	//#region static

	private static tables: Map<CacheItemObjectType, DataTable<CacheItemObjectType>>;

	public static config: Record<CacheItemObjectType, Required<DataTableConfigItem>>;

	public static formatFiles: boolean;

	/** returns the ObjectCache for the given key */
	public static for(objectType: "Character"): CachedDataTable<"Character", CharacterCacheItem>;
	public static for(objectType: "Game"): CachedDataTable<"Game", GameCacheItem>;
	public static for(objectType: "Message"): UncachedDataTable<"Message">;
	public static for(objectType: "Server"): CachedDataTable<"Server">;
	public static for(objectType: "User"): CachedDataTable<"User">;
	public static for<ObjectType extends CacheItemObjectType>(objectType: ObjectType): CachedDataTable<CacheItemObjectType>;
	public static for(objectType: CacheItemObjectType): UncachedDataTable<CacheItemObjectType> | undefined {
		return DataTable.tables.get(objectType);
	}

	public static initialize(options?: Record<CacheItemObjectType, DataTableConfigItem>): typeof DataTable {
		DataTable.tables = new Map();

		const formatFiles = getCodeName() === "dev";

		const getConfigItem = (objectType: CacheItemObjectType): Required<DataTableConfigItem> => {
			const opts = options?.[objectType];
			return {
				dataMode: opts?.dataMode ?? "file",
				formatFiles: opts?.formatFiles ?? formatFiles,
				isCached: opts?.isCached ?? !["Dice", "Message"].includes(objectType),
				objectType: opts?.objectType ?? objectType,
				tableName: opts?.tableName ?? objectTypeToTableName(objectType)
			};
		};

		DataTable.config = {
			Character: getConfigItem("Character"),
			Dice: getConfigItem("Dice"),
			Game: getConfigItem("Game"),
			Message: getConfigItem("Message"),
			Server: getConfigItem("Server"),
			User: getConfigItem("User"),
		};

		return DataTable;
	}

	/** if no objectTypes are given, then all are populated. */
	public static async populate(...objectTypes: CacheItemObjectType[]): Promise<boolean> {
		if (!objectTypes.length) {
			objectTypes = Object.keys(DataTable.config) as CacheItemObjectType[];
		}

		let populated = true;
		for (const objectType of objectTypes) {
			if (!DataTable.tables.has(objectType)) {
				const configItem = DataTable.config[objectType];
				const dataTable = new DataTable(configItem);
				DataTable.tables.set(objectType, dataTable);
				if (dataTable.isCached) {
					populated &&= await dataTable.populate() ?? false;
				}
			}
		}
		return populated;
	}

	//#endregion

	//#region Character Import logic

	/**
	 * @deprecated
	 * Temporary solution for checking existance of imported characters.
	 * Will be removed when all imported character data is stored as part of the SageCharacter.
	 * Handles the data source (json file vs ddb) so that main Sage code can stop reading files.
	 */
	public static async characterImportExists(which: "e20" | "heph" | "pb2e", characterId: string): Promise<boolean> {
		const jsonPath = getJsonPath(which, characterId);
		return await fileExists(jsonPath).catch(errorReturnFalse);
	}

	/**
	 * @deprecated
	 * Temporary solution for reading imported characters.
	 * Will be removed when all imported character data is stored as part of the SageCharacter.
	 * Handles the data source (json file vs ddb) so that main Sage code can stop reading files.
	 */
	public static async readCharacterImport<T>(which: "e20" | "heph" | "pb2e", characterId: string): Promise<T | undefined> {
		const jsonPath = getJsonPath(which, characterId);
		return await readJsonFile<T>(jsonPath).catch(errorReturnUndefined) ?? undefined;
	}

	/**
	 * @deprecated
	 * Temporary solution for reading imported characters.
	 * Will be removed when all imported character data is stored as part of the SageCharacter.
	 * Handles the data source (json file vs ddb) so that main Sage code can stop reading files.
	 */
	public static readCharacterImportSync<T>(which: "e20" | "heph" | "pb2e", characterId: string): T | undefined {
		const jsonPath = getJsonPath(which, characterId);
		try {
			return readJsonFileSync<T>(jsonPath) ?? undefined;
		}catch(ex) {
			return errorReturnUndefined(ex);
		}
	}

	/**
	 * @deprecated
	 * Temporary solution for writing imported characters.
	 * Will be removed when all imported character data is stored as part of the SageCharacter.
	 * Handles the data source (json file vs ddb) so that main Sage code can stop writing files.
	 */
	public static async writeCharacterImport(which: "e20" | "heph" | "pb2e", character: ImportedCharacterOrJson): Promise<boolean> {
		const json = "toJSON" in character ? character.toJSON() : character;
		const jsonPath = getJsonPath(which, json.id);
		return await writeFile(jsonPath, json, { makeDir:true }).catch(errorReturnFalse);
	}

	//#endregion

	//#region temp data logic

	public static async writeTempData(_core: unknown, _tempId?: Snowflake): Promise<string | undefined> {
		// const id = tempId ?? generateSnowflake();
		// const tempCore = { id, core, objectType:"TempData" };
		// const dataTable = DataTable.for("TempData");
		// const saved = await dataTable.write(tempCore);
		// return saved ? id : undefined;
		return undefined;
	}

	public static async readTempData<T>(_id: string): Promise<T | undefined> {
		return undefined;
	}

	//#endregion

	//#region dev cache files

	/** @deprecated @todo rework the search cache strategy */
	private static createCacheFilePath(fileName: string): string {
		return join("../", fileName);
	}

	/** @deprecated @todo rework the search cache strategy */
	public static async readSearchHtmlCache(fileName: string): Promise<string | undefined> {
		// instead of checking that the file exists before reading, simply ignore a failed read
		return await readText(DataTable.createCacheFilePath(fileName)).catch(() => undefined);
	}

	/** @deprecated @todo rework the search cache strategy */
	public static async writeSearchHtmlCache(fileName: string, content: string): Promise<void> {
		await writeFile(DataTable.createCacheFilePath(fileName), content);
	}

	//#endregion

	//#region map data files

	/**
	 * Creates the filePath for the given messageId.
	 * @deprecated @todo maps should get their own DataTable
	 * @param messageId the id of the message the map is rendered in
	 */
	private static createMapFilePath(messageId: string): string {
		return formatDataFilePath(["sage", "maps"], messageId);
	}

	/**
	 * Returns true if a map exists for the given messageId.
	 * Handles errors.
	 * @deprecated @todo maps should get their own DataTable
	 * @param messageId the id of the message the map is rendered in
	 */
	public static async mapExists(messageId: Optional<string>): Promise<boolean>;
	/**
	 * Returns true if a map exists for the given messageId and the name matches the given mapName.
	 * Handles errors.
	 * @deprecated @todo maps should get their own DataTable
	 * @param messageId the id of the message the map is rendered in
	 * @param mapName the name to compare to the map core's name
	 */
	public static async mapExists(messageId: string, mapName: string): Promise<boolean>
	public static async mapExists(messageId: Optional<string>, mapName?: string): Promise<boolean> {
		// ensure a messageId
		if (!messageId) {
			return false;
		}

		const filePath = DataTable.createMapFilePath(messageId);

		// if we don't have a mapName, we are just checking the map exists
		if (!mapName) {
			return await fileExists(filePath);
		}

		// read the core and compare names
		const mapCore = await readJsonFile<{ name?:string; }>(filePath).catch(() => undefined);
		return mapCore?.name === mapName
	}

	/**
	 * Deletes the map for the given messageId.
	 * Handles errors.
	 * @deprecated @todo maps should get their own DataTable
	 * @param messageId the id of the message the map is rendered in
	 */
	public static async deleteMap(messageId: string): Promise<boolean> {
		const filePath = DataTable.createMapFilePath(messageId);
		return await deleteFile(filePath).catch(errorReturnFalse);
	}

	/**
	 * Reads the map core/json for the given messageId.
	 * Handles errors.
	 * @deprecated @todo maps should get their own DataTable
	 * @param messageId the id of the message the map is rendered in
	 */
	public static async readMap<MapCore>(messageId: string): Promise<MapCore | undefined> {
		const filePath = DataTable.createMapFilePath(messageId);
		return await readJsonFile<MapCore>(filePath).catch(errorReturnUndefined) ?? undefined;
	}

	/**
	 * Saves the given map using the given messageId.
	 * Handles errors.
	 * @deprecated @todo maps should get their own DataTable
	 * @param messageId the id of the message the map is rendered in
	 * @param mapCore the json object to write to file
	 */
	public static async writeMap(messageId: string, mapCore: unknown): Promise<boolean> {
		const filePath = DataTable.createMapFilePath(messageId);
		return await writeFile(filePath, mapCore, { makeDir:true }).catch(errorReturnFalse);
	}

	//#endregion

	//#region PF2E data (hand typed by Sage staff; deprecated; moving to foundry data)

	/**
	 * @deprecated
	 * PF2e data used to be hand typed so that we could search for and display individual items.
	 * That task was too time consuming, and so we stopped doing it with the plan to switch to using the freely available Foundry data.
	 * This code is legacy that cannot be ripped out quite yet because we still use weapon data for a couple things.
	 * But, since we are moving the data layer, the data / file read logic is going to live here until it is removed.
	 */
	public static async populatePf2eData<Core>(coreHandler: (core: Optional<Core>, filePath: string) => number) {
		const pf2DataPath = getDataRoot("pf2e");

		const files: string[] = await filterFiles(pf2DataPath, { fileExt:"json", recursive:true })
			.catch(errorReturnEmptyArray);

		const loaded = {
			other: 0,
			source: 0,
			total: files.length,
		};

		if (!files.length) {
			return loaded;
		}

		const [sources, others] = partition(files, file => file.includes("/Source/") ? 0 : 1);

		for (const source of sources) {
			const core = await readJsonFile<Core>(source).catch(warnReturnUndefined);
			loaded.source += coreHandler(core, source);
		}

		for (const other of others) {
			const core = await readJsonFile<Core>(other).catch(warnReturnUndefined);
			loaded.other += coreHandler(core, other);
		}

		return loaded;
	}

	//#endregion
}

/** @deprecated Used only for DataTable.writeCharacterImport */
type ImportedCharacterOrJson = {
	id: string;
	toJSON: () => { id:string; };
} | {
	id: string;
}
