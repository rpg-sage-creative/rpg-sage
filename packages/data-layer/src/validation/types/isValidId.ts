import { isNonNilSnowflake, isNonNilUuid, type Snowflake, type UUID } from "@rsc-utils/core-utils";

export function isValidId(id: unknown): id is Snowflake | UUID {
	return typeof(id) === "string" ? isNonNilSnowflake(id) || isNonNilUuid(id) : false;
}