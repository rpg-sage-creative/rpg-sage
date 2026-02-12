import type { OrUndefined } from "@rsc-utils/core-utils";
import { readJsonFile } from "@rsc-utils/io-utils";
import type { CacheItemKey, GlobalCacheItem } from "../types.js";
import { getJsonPath } from "./getJsonPath.js";

/**
 * @internal
 * Reads the item from the file system.
 */
export async function fetchFromFile<T extends GlobalCacheItem>(key: CacheItemKey, item: GlobalCacheItem): Promise<OrUndefined<T>> {
	// read by id first
	let json = await readJsonFile<T>(getJsonPath(key, item.id)).catch(() => undefined);

	// read by did if id missed
	if (!json && item.did) {
		json = await readJsonFile<T>(getJsonPath(key, item.did)).catch(() => undefined);
	}

	// read by uuid id id and did missed
	if (!json && item.uuid) {
		json = await readJsonFile<T>(getJsonPath(key, item.uuid)).catch(() => undefined);
	}

	return json ?? undefined;
}