import { Snowflake } from "discord.js";
import { Optional } from "../../sage-utils";
import { errorReturnNull } from "../../sage-utils/utils/ConsoleUtils/Catchers";
import { DMessage } from "./types";
import { EphemeralSet } from "../../sage-utils/utils/ArrayUtils/EphemeralSet";
import GameMapBase from "../sage/commands/map/GameMapBase";

const deleted = new EphemeralSet<Snowflake>(1000 * 60);

/* We only really need to store deleted state for seconds due to races with Tupper. */

export function setDeleted(messageId: Snowflake): void {
	// console.log(`${Date.now()}: setDeleted("${messageId}")`);
	deleted.add(messageId);
	GameMapBase.delete(messageId);
}

export function isDeleted(messageId: Snowflake): boolean {
	// console.log(`${Date.now()}: isDeleted("${messageId}") = ${deleted.has(messageId)}`);
	return deleted.has(messageId);
}

export enum MessageDeleteResults { InvalidMessage = -2, NotDeletable = -1, NotDeleted = 0, Deleted = 1, AlreadyDeleted = 2 }

/**
 * Tries to safely delete a message.
 * The message is checked to see if it exists, has an id, and is deletable.
 * It is then checked against known deleted messages.
 * Only then is a delete call attempted.
 */
export async function deleteMessage(message: Optional<DMessage>): Promise<MessageDeleteResults> {
	if (!message?.id) return MessageDeleteResults.InvalidMessage;
	if (!message.deletable) return MessageDeleteResults.NotDeletable;
	if (isDeleted(message.id)) return MessageDeleteResults.AlreadyDeleted;
	const results = await message.delete().catch(errorReturnNull);
	if (results?.deletable === false) MessageDeleteResults.Deleted;
	return MessageDeleteResults.NotDeleted;
}

/**
 * Tries to safely delete all the given messages.
 */
export async function deleteMessages(messages: Optional<DMessage>[]): Promise<MessageDeleteResults[]> {
	const results = [];
	for (const message of messages) {
		results.push(await deleteMessage(message));
	}
	return results;
}
