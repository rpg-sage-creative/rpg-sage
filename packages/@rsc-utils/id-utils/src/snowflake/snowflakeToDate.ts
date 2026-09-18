import type { Snowflake } from "./types.js";

const DISCORD_EPOCH = 1420070400000;

// Converts a snowflake ID string into a JS Date object using the provided epoch (in ms), or Discord's epoch if not provided
export function snowflakeToDate(snowflake: Snowflake, epoch = DISCORD_EPOCH) {
	// Convert snowflake to BigInt to extract timestamp bits
	// https://discord.com/developers/docs/reference#snowflakes
	const milliseconds = BigInt(snowflake) >> 22n;
	return new Date(Number(milliseconds) + epoch);
}