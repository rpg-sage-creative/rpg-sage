import { error, getCodeName, tagLiterals } from "@rsc-utils/core-utils";
import { ensureNonNilId } from "./internal/ensureNonNilId.js";
import { getPopulateHandler, type PopulateHandler } from "./internal/getPopulateHandler.js";
import { getReadHandler, type ReadHandler } from "./internal/getReadHandler.js";
import { getWriteHandler, type WriteHandler } from "./internal/getWriteHandler.js";
import { simplifyCacheItem, simplifyForLogging } from "./internal/simplify.js";
import type { BaseCacheItem, CacheItemObjectType, CacheItemTableName, CharacterCacheItem, DataMode, GameCacheItem } from "./types.js";
import { objectTypeToTableName } from "./types.js";

type DataTableConfigItem = {
	/** default: "file" */
	dataMode?: DataMode;
	/** default: getCodeName() === "dev" */
	formatFiles?: boolean;
	/** default: objectType !== "Message" */
	isCached?: boolean;

	objectType: CacheItemObjectType;
	tableName?: CacheItemTableName;
};

type UncachedDataTable<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemTableName = Lowercase<`${ObjectType}s`>,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>
> = {
	tableName: TableName;
	fetch<Core extends CacheItem>(item: CacheItem): Promise<Core | undefined>;
	write<Core extends CacheItem>(core: Core): Promise<boolean>;
};

type CachedDataTable<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemTableName = Lowercase<`${ObjectType}s`>,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>
> = UncachedDataTable<ObjectType, TableName, CacheItem> & {
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
	TableName extends CacheItemTableName = Lowercase<`${ObjectType}s`>,
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

	public readonly populateHandler: PopulateHandler<ObjectType, TableName>;

	public readonly readHandler: ReadHandler<CacheItem>;

	public readonly tableName: TableName;

	public wasPopulated: boolean;

	private readonly writeHandler: WriteHandler<ObjectType, TableName>;

	private constructor(
		{ dataMode, formatFiles, isCached, objectType, tableName }: Required<DataTableConfigItem>,
	) {
		this.dataMode = dataMode;
		this.formatFiles = formatFiles;
		this.isCached = isCached;
		this.objectType = objectType as ObjectType;
		this.populateHandler = getPopulateHandler(dataMode);
		this.readHandler = getReadHandler(dataMode);
		this.tableName = tableName as TableName;
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

		const core = await this.readHandler(this.tableName, item);
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

		// set the updatedTs
		item.updatedTs = Date.now();

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
	public static for(objectType: "Character"): CachedDataTable<"Character", "characters", CharacterCacheItem>;
	public static for(objectType: "Game"): CachedDataTable<"Game", "games", GameCacheItem>;
	public static for(objectType: "Message"): UncachedDataTable<"Message", "messages">;
	public static for(objectType: "Server"): CachedDataTable<"Server", "servers">;
	public static for(objectType: "User"): CachedDataTable<"User", "users">;
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
				isCached: opts?.isCached ?? objectType !== "Message",
				objectType: opts?.objectType ?? objectType,
				tableName: opts?.tableName ?? objectTypeToTableName(objectType)
			};
		};

		DataTable.config = {
			Character: getConfigItem("Character"),
			Game: getConfigItem("Game"),
			Message: getConfigItem("Message"),
			Server: getConfigItem("Server"),
			User: getConfigItem("User"),
		};

		return DataTable;
	}

	/** if not objectTypes are given, then all are populated. */
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
}
