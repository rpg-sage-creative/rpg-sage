import { type Snowflake, SnowflakeUtil } from "discord.js";

/** A convenience function for: SnowflakeUtil.generate().toString() */
export function randomSnowflake(): Snowflake {
	return SnowflakeUtil.generate().toString();
}