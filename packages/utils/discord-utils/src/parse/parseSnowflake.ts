import type { Optional, Snowflake } from "@rsc-utils/core-utils";

/** A convenient method for grabbing the first Snowflake present in the string. */
export function parseSnowflake(value: Optional<string>): Snowflake | null {
	return /(?<id>\d{16,})/.exec(value ?? "")?.groups?.id ?? null;
}