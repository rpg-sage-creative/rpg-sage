import { type Snowflake, isNonNilSnowflake } from "@rsc-utils/snowflake-utils";

export function isValidId(value: string | number | null | undefined): value is Snowflake {
	return isNonNilSnowflake(String(value));
}
