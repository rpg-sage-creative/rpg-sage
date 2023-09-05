import { Snowflake } from "discord.js";

const deleted = new Set<Snowflake>();

export function setDeleted(messageId: Snowflake): void {
	console.log(`setDeleted("${messageId}")`);
	deleted.add(messageId);
}

export function isDeleted(messageId: Snowflake): boolean {
	console.log(`isDeleted("${messageId}") = ${deleted.has(messageId)}`);
	return deleted.has(messageId);
}