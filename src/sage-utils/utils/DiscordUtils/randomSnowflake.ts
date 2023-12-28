import { SnowflakeUtil } from "discord.js";

export function randomSnowflake() {
	return SnowflakeUtil.generate().toString();
}