import { isNonNilSnowflake, isNonNilUuid, type Snowflake, type UUID } from "@rsc-utils/core-utils";

type HasIds = {
	did?: string;
	id: string;
	uuid?: string;
};

/**
 * @internal
 * Makes sure we don't have an invalid value for the id
 */
export function ensureNonNilId({ id, did, uuid }: HasIds): Snowflake | UUID | undefined {
	if (isNonNilUuid(id)) return id;
	if (isNonNilSnowflake(id)) return id;
	if (isNonNilSnowflake(did)) return did;
	if (isNonNilUuid(uuid)) return uuid;
	return undefined;
}