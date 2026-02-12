import { errorReturnUndefined } from "@rsc-utils/core-utils";
import { readJsonFile } from "@rsc-utils/io-utils";
import { simplifyCacheItem } from "./simplifyCacheItem.js";
import type { GlobalCacheItem } from "../types.js";
/*
 * Possible good place to convert data objects for ddb.
 * 1. Read from ddb.
 *     - if exists, return object; (done)
 * 2. If UPDATE_DATA_MODE is not on, return undefined; (done)
 * 3. Read from file
 *     - if not exists; return undefined; (done)
 * 4. Update core
 * 5. Queue cleanup thread
 * 6. return object
 * 7. Cleanup thread writes to ddb
 * 8. Cleanup thread deletes file
 */

/**
 * @internal
 * Reads the json at the given path and updates the in memory global cache.
 * Used only for globalCachePopulate
 * @todo for a ddbrepo this should fetch instead of readJsonFile
 */
export async function readAndCache(cache: Map<string, GlobalCacheItem>, path: string): Promise<boolean> {
	// read it
	let json = await readJsonFile<GlobalCacheItem>(path).catch(errorReturnUndefined);
	if (!json) {
		return false;
	}

	// simplify it for the cache (to reduce memory usage)
	json = simplifyCacheItem(json);

	// cache it by all ids
	if (json?.id) cache.set(json.id, json);
	if (json?.did) cache.set(json.did, json);
	if (json?.uuid) cache.set(json.uuid, json);

	return true;
}