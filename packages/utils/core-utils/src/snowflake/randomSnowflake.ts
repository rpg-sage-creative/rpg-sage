import { DiscordSnowflake } from "@sapphire/snowflake";
import type { Snowflake } from "./types.js";

type SnowflakeOptions = { timestamp?:bigint|Date|number; };

/** A convenience method for generating Discord snowflakes and returning them as a string. */
export function randomSnowflake(options?: SnowflakeOptions): Snowflake {
	return DiscordSnowflake.generate(options).toString() as Snowflake;
}