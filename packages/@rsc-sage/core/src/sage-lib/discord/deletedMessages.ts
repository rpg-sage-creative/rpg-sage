import { debug, EphemeralSet, verbose, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, isDiscordApiError } from "@rsc-utils/discord-utils";
import type { Channel, Collection, Message, PartialMessage } from "discord.js";
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

export enum MessageDeleteResults {
	UnknownMessage = -3,
	InvalidMessage = -2,
	NotDeletable = -1,
	NotDeleted = 0,
	Deleted = 1,
	AlreadyDeleted = 2
}

/**
 * Tries to safely delete all the given messages.
 * Bulk delete is attempted if possible.
 */
export async function deleteMessages(messages: Optional<Message | PartialMessage>[] | Collection<string, Message>): Promise<MessageDeleteResults[]> {
	// convert a collection into an array
	if ("values" in messages) {
		messages = [...messages.values()];
	}

	// let's check for length to avoid wasting time
	if (!messages.length) return [];

	// because we can delete messages out of order, we have to store the results for later
	const resultMap = new Map<string, MessageDeleteResults>();

	// the bulk delete channel counter
	const channelMap: Record<string, number> = { };

	// fetch any partials and track channels with bulkDeletable messages
	for (let i = 0; i < messages.length; i++) {
		let message = messages[i];
		if (message?.partial) {
			const fetched = await message.fetch().catch(messageCatcher) ?? undefined;
			message = messages[i] = fetched !== MessageDeleteResults.UnknownMessage ? message : undefined;
		}
		if (message?.bulkDeletable) {
			channelMap[message.channelId] = 1 + (channelMap[message.channelId] ?? 0);
		}
	}

	// get the channel ids that have more than one bulkDeletable message
	const bulkChannelIds = Object.keys(channelMap).filter(key => channelMap[key] > 1);
	for (const channelId of bulkChannelIds) {
		// grab the channel's messages
		const channelMessages = messages.filter(message => message?.channelId === channelId) as Message[];

		// grab a channel that isn't a partial
		let channel: Channel | undefined = channelMessages.find(message => message.channel && !message.channel.partial)?.channel ?? channelMessages[0].channel;

		// exit out if we don't have a channel
		if (!channel) break;

		// if partial, go fetch ...
		if (channel?.partial) {
			// ... unless we have fewer than 3 messages, because that would be a waste of api calls
			if (channelMessages.length < 3) break;

			// fetch the channel
			channel = await channel.fetch().catch(DiscordApiError.process);
		}

		// if we have a channel that has bulkDelete, go do it
		if (channel && "bulkDelete" in channel) {
			// process bulk delete
			const bulkResults = await channel.bulkDelete(channelMessages, true).catch(DiscordApiError.process);

			// mark the deleted messages as deleted
			if (bulkResults) {
				for (const [id, message] of bulkResults) {
					resultMap.set(id, message?.deletable ? MessageDeleteResults.NotDeleted : MessageDeleteResults.Deleted);
				}
			}
		}
	}

	// manually delete the messages not yet deleted
	for (const message of messages) {
		if (message && resultMap.get(message.id) !== MessageDeleteResults.Deleted) {
			resultMap.set(message.id, await deleteMessage(message));
		}
	}

	// get the results in the same order we received the messages
	return messages.map(message => resultMap.get(message?.id!) ?? MessageDeleteResults.InvalidMessage);
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

function messageCatcher(err: unknown): MessageDeleteResults.UnknownMessage | undefined {
	return isDiscordApiError(10008) ? MessageDeleteResults.UnknownMessage : DiscordApiError.process(err);
}

/** @private Worker function for deleteMessage. */
async function _deleteMessage(message: Optional<Message | PartialMessage>): Promise<MessageDeleteResults> {
	if (!message?.id) return MessageDeleteResults.InvalidMessage; //NOSONAR

	if (message.partial) {
		const results = await message.fetch().catch(messageCatcher);
		if (results === MessageDeleteResults.UnknownMessage) return MessageDeleteResults.UnknownMessage; // NOSONAR
		if (!results) return MessageDeleteResults.NotDeleted; // NOSONAR
	}

	if (!message.deletable) return MessageDeleteResults.NotDeletable; //NOSONAR

	if (isDeleted(message.id as Snowflake)) return MessageDeleteResults.AlreadyDeleted; //NOSONAR

	const results = await message.delete().catch(messageCatcher);
	if (results === MessageDeleteResults.UnknownMessage) return MessageDeleteResults.UnknownMessage; // NOSONAR
	if (!results) return MessageDeleteResults.NotDeleted; // NOSONAR

	return MessageDeleteResults.Deleted;
}
