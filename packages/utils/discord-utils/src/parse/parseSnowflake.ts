import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";

/** A convenient method for grabbing the first Snowflake present in the string. */
export function parseSnowflake(value: Optional<string>): Snowflake | null {
	return /(?<id>\d{16,})/.exec(value ?? "")?.groups?.id ?? null;
}