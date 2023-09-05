import { Snowflake } from "discord.js";

const deleted = new Set<Snowflake>();

export function setDeleted(messageId: Snowflake): void {
	// console.log(`${Date.now()}: setDeleted("${messageId}")`);
	deleted.add(messageId);
}

export function isDeleted(messageId: Snowflake): boolean {
	// console.log(`${Date.now()}: isDeleted("${messageId}") = ${deleted.has(messageId)}`);
	return deleted.has(messageId);
}