import { isNonNilSnowflake, isNonNilUuid, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import type { GlobalCacheItem } from "../types.js";

/**
 * @internal
 * Makes sure we don't have an invalid value for the id
 */
export function ensureNonNilId({ id, did, uuid }: GlobalCacheItem): Snowflake | UUID | undefined {
	if (isNonNilUuid(id)) return id;
	if (isNonNilSnowflake(id)) return id;
	if (isNonNilSnowflake(did)) return did;
	if (isNonNilUuid(uuid)) return uuid;
	return undefined;
}