import { DiscordSnowflake } from "@sapphire/snowflake";
import type { Snowflake } from "./types.js";

type SnowflakeOptions = {
	/** sequence number for generating mulitple Snowflake values for a specific timestamp */
	seq?: bigint | number;
	/** the timestamp to use as the date portion of the Snowflake */
	ts?: bigint | Date | number;
};

/** A convenience method for generating Discord snowflakes and returning them as a string. */
export function generateSnowflake(options?: SnowflakeOptions): Snowflake {
	const timestamp = options?.ts;
	const increment = options?.seq ? BigInt(options.seq) : undefined;
	return DiscordSnowflake.generate({ increment, timestamp }).toString() as Snowflake;
}

/** @deprecated use generateSnowflake() instead */
export const randomSnowflake = generateSnowflake;