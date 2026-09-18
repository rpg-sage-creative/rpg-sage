import type { Optional, TypedRegExp } from "@rsc-utils/type-utils";
import type { Snowflake } from "./types.js";

const SnowflakeRegExp = (/\b(?<id>\d{16,})\b/) as TypedRegExp<{ id:Snowflake; }>;

/** A convenient method for grabbing the first Snowflake present in the string. */
export function parseSnowflake(value: Optional<string>): Snowflake | undefined {
	return typeof(value) === "string" ? SnowflakeRegExp.exec(value)?.groups?.id : undefined;
}