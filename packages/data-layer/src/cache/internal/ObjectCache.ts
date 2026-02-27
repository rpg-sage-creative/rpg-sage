import { capitalize, error, errorReturnFalse, errorReturnUndefined, forEachAsync, getDataRoot, randomSnowflake, tagLiterals, verbose } from "@rsc-utils/core-utils";
import { filterFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { assertSageGameCore, assertSageMessageReferenceCore, assertSageServerCore, assertSageUserCore, type SageUserCore } from "../../types/index.js";
import type { CacheItemKey, DataMode, GlobalCacheItem } from "../types.js";
import { ensureNonNilId } from "./ensureNonNilId.js";
import { fetchFromDdb } from "./fetchFromDdb.js";
import { fetchFromFile } from "./fetchFromFile.js";
import { getJsonPath } from "./getJsonPath.js";
import { simplifyCacheItem } from "./simplifyCacheItem.js";
import { simplifyForLogging } from "./simplifyForLogging.js";

/**
 * @internal
 * Represents a cache for a specific ObjectType, as specified by ObjectCache.key
 */
export class ObjectCache<Key extends CacheItemKey, CacheItem extends GlobalCacheItem = GlobalCacheItem> {
	private cache = new Map<string, CacheItem>();

	public constructor(public key: Key, public dataMode: DataMode, public formatFiles: boolean) { }

	/**
	 * Fetches the cached item from source (ddb/file) to ensure we have a fresh copy of the item.
	 */
	public async fetch(item: CacheItem): Promise<CacheItem | undefined> {
		if (!item.id && !item.did && !item.uuid) {
			error(tagLiterals`GlobalCache.ObjectCache.fetch(${this.key}, ${simplifyForLogging(item)})`);
			return undefined;
		}

		switch(this.dataMode) {
			case "ddb": return fetchFromDdb(this.key, item);
			case "ddb-first": return await fetchFromDdb(this.key, item) ?? fetchFromFile(this.key, item);
			case "file": return fetchFromFile(this.key, item);
			case "file-first": return await fetchFromFile(this.key, item) ?? fetchFromDdb(this.key, item);
			default: return undefined;
		}
	}

	/**
	 * Returns the in memory globally cached GlobalCacheItem array that matches the filter.
	 * It is expected that if you need an instance of the item that you will use ObjectCache.fetch().
	*/
	public filter(predicate: (core: CacheItem) => unknown): CacheItem[] {
		const filtered: CacheItem[] = [];

		// iterate the cached items
		const cores = this.cache.values();
		for (const core of cores) {
			if (predicate(core)) {
				filtered.push(core);
			}
		}

		return filtered;
	}

	/**
	 * Returns the in memory globally cached GlobalCacheItem that matches the filter.
	 * It is expected that if you need an instance of the item that you will use ObjectCache.fetch().
	*/
	public find(predicate: (core: CacheItem) => unknown): CacheItem | undefined {
		// iterate the cached items
		const cores = this.cache.values();
		for (const core of cores) {
			if (predicate(core)) {
				return core;
			}
		}

		return undefined;
	}

	/**
	 * Returns the in memory globally cached GlobalCacheItem by id.
	 * It is expected that if you need an instance of the item that you will use ObjectCache.fetch().
	 */
	public get(id: string): CacheItem | undefined {
		return this.cache.get(id);
	}

	private async readAndCache(filePath: string): Promise<boolean> {
		// read it
		let json = await readJsonFile<CacheItem>(filePath).catch(errorReturnUndefined);
		if (!json) {
			return false;
		}

		// simplify it for the cache (to reduce memory usage)
		json = simplifyCacheItem(json) as CacheItem;

		// cache it by all ids
		if (json?.id) this.cache.set(json.id, json);
		if (json?.did) this.cache.set(json.did, json);
		if (json?.uuid) this.cache.set(json.uuid, json);

		return true;
	}

	public async populate(): Promise<boolean> {
		const { key } = this;

		verbose(tagLiterals`Populating ${key} ...`);

		// iterate the json files and load cache data into memory
		const path = getDataRoot(`sage/${key}`);

		verbose(tagLiterals`  Reading from ${key} ...`);

		const files = await filterFiles(path, { fileExt:"json" });

		verbose(tagLiterals`  Found ${files.length} files ...`);

		const errors: string[] = [];

		await forEachAsync(`  Reading files`, files, async file => {
			const cached = await this.readAndCache(file);
			if (!cached) {
				errors.push(file);
			}
		});

		// send to the logs so we can see if something is amiss
		verbose({ key:this.key, path, files:files.length, errors:errors.length, keys:this.cache.size });

		return true;
	}

	public async validate(yearArgs?: string[]): Promise<boolean> {
		const { key } = this;
		const what = capitalize(key);

		const objectRoot = getDataRoot(`sage/${key}`);

		const errors: string[] = [];
		const invalid: string[] = [];
		let fileCount = 0;

		verbose(`ObjectType: ${what}`);
		verbose(`  ${what} Path: ${objectRoot}`);

		const children = key === "messages" ? yearArgs ?? [2021, 2022, 2023, 2024, 2025, 2026] : [""];
		if (children[0]) {
			verbose(`  ${what} Children: ${children}`);
		}
		for (const child of children) {
			const dataPath = child ? `${objectRoot}/${child}` : objectRoot;
			if (child) {
				verbose(`  ${what} ${child} Path: ${dataPath}`);
			}

			verbose(`  Counting ${what} ...`);
			const files = await filterFiles(dataPath, { fileExt:"json", recursive:true });
			verbose(`                 ... ${files.length} found.`)

			fileCount += files.length;

			await forEachAsync(`    Validating ${child ? what + " " + child : what}`, files, async file => {
				const core = await readJsonFile<CacheItem>(file).catch(errorReturnUndefined);
				if (!core) {
					errors.push(file);
				}else {
					switch(key) {
						case "games": if (!assertSageGameCore(core)) invalid.push(file); break;
						case "messages": if (!assertSageMessageReferenceCore(core)) invalid.push(file); break;
						case "servers": if (!assertSageServerCore(core)) invalid.push(file); break;
						case "users": if (!assertSageUserCore(core as SageUserCore)) invalid.push(file); break;
					}
				}
			});
		}

		// send to the logs so we can see if something is amiss
		verbose({ key:this.key, path:objectRoot, files:fileCount, errors:errors.length, invalid:invalid.length, keys:this.cache.size });

		return !errors.length && !invalid.length;
	}

	public async put(item: CacheItem): Promise<boolean> {
		// ensure this item has an id
		let itemId = ensureNonNilId(item);
		if (!itemId) {
			/** @todo when can i ensure this will never be called !? */
			error(tagLiterals`GlobalCache.ObjectCache.put(${this.key}, ${simplifyForLogging(item)})`);
			itemId = randomSnowflake();
			item.id = itemId;
		}

		// write to file using the first id found (should be .id)
		const path = getJsonPath(this.key, itemId);
		const saved = await writeFile(path, item, { makeDir:true, formatted:this.formatFiles }).catch(errorReturnFalse);
		if (!saved) {
			return false;
		}

		// rereads and caches the newly written file to ensure our in memory object is clean, fresh, and unspoiled
		return this.readAndCache(path);
	}
}