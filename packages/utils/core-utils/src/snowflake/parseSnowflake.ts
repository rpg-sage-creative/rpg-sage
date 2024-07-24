import type { Optional } from "../types/generics.js";
import type { Snowflake } from "./types.js";

/** A convenient method for grabbing the first Snowflake present in the string. */
export function parseSnowflake(value: Optional<string>): Snowflake | undefined {
	const regex = /(?<id>\d{16,})/;
	const match = regex.exec(value ?? "");
	return match?.groups?.id as Snowflake ?? undefined;
}