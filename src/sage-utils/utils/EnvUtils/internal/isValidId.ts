import type { Snowflake } from "discord.js";

export function isValidId(value: string | number | null | undefined): value is Snowflake {
	const string = String(value);
	return /^\d{16,}$/.test(string) && !/^0{16,}$/.test(string);
}
