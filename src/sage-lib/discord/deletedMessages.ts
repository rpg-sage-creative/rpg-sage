import { EphemeralSet } from "@rsc-utils/cache-utils";
import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { debug, errorReturnNull, verbose } from "@rsc-utils/core-utils";
import type { Message, PartialMessage } from "discord.js";
import { GameMapBase } from "../sage/commands/map/GameMapBase.js";

/* We only really need to store deleted state for seconds due to races with Tupper. */
const deleted = new EphemeralSet<Snowflake>(1000 * 60);

/** Marks the given messageIds as deleted and attempts to delete map data if it exists. */
export function setDeleted(...messageIds: Snowflake[]): void {
	const idList = messageIds.map(id => `"${id}"`).join(", ");
	verbose(`${Date.now()}: setDeleted(${idList})`);
	for (const messageId of messageIds) {
		deleted.add(messageId);
		GameMapBase.delete(messageId);
	}
}

/** Checks to see if the given messageId is currently in our deleted set. */
export function isDeleted(messageId: Snowflake): boolean {
	verbose(`${Date.now()}: isDeleted("${messageId}") = ${deleted.has(messageId)}`);
	return deleted.has(messageId);
}

/** Checks to see if the value given is a message that is marked deletable and also isn't in our deleted set. */
export function isDeletable(message: Optional<Message>): message is Message {
	return message ? message.deletable && !isDeleted(message.id as Snowflake) : false;
}

export enum MessageDeleteResults { InvalidMessage = -2, NotDeletable = -1, NotDeleted = 0, Deleted = 1, AlreadyDeleted = 2 }

/**
 * Tries to safely delete all the given messages.
 */
export async function deleteMessages(messages: Optional<Message | PartialMessage>[]): Promise<MessageDeleteResults[]> {
	const results = [];
	for (const message of messages) {
		results.push(await deleteMessage(message));
	}
	return results;
}

/**
 * Tries to safely delete a message.
 * The message is checked to see if it exists, has an id, and is deletable.
 * It is then checked against known deleted messages.
 * Only then is a delete call attempted.
 */
export async function deleteMessage(message: Optional<Message | PartialMessage>): Promise<MessageDeleteResults> {
	const result = await _deleteMessage(message);
	debug(`deleteMessage(${message?.id}) = ${MessageDeleteResults[result]}`);
	return result;
}

/** @private Worker function for deleteMessage. */
async function _deleteMessage(message: Optional<Message | PartialMessage>): Promise<MessageDeleteResults> {
	if (!message?.id) return MessageDeleteResults.InvalidMessage; //NOSONAR
	if (message.partial) await message.fetch();
	if (!message.deletable) return MessageDeleteResults.NotDeletable; //NOSONAR
	if (isDeleted(message.id as Snowflake)) return MessageDeleteResults.AlreadyDeleted; //NOSONAR
	const results = await message.delete().catch(errorReturnNull);
	if (results) return MessageDeleteResults.Deleted; // NOSONAR
	// if (results?.deletable === false) return MessageDeleteResults.Deleted; //NOSONAR
	return MessageDeleteResults.NotDeleted;
}
