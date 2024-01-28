import { SnowflakeUtil } from "discord.js";
import type { Snowflake } from "./types.js";

/** A convenience function for: SnowflakeUtil.generate().toString() */
export function randomSnowflake(): Snowflake {
	return SnowflakeUtil.generate().toString();
}