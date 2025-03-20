import { errorReturnFalse, errorReturnNull, getDataRoot, isNonNilSnowflake, orNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { readJsonFile, writeFile } from "@rsc-utils/io-utils";
import type { Message, MessageReference, PartialMessage } from "discord.js";

/** @deprecated Moving to DialogMessageData */
export type TDialogMessage = {
	channelDid: Snowflake;
	characterId: Snowflake;
	gameId: Snowflake;
	messageDid: Snowflake;
	serverDid: Snowflake;
	threadDid: Snowflake;
	timestamp: number;
	userDid: Snowflake;
};

export type DialogMessageDataCore = {
	/** the id of the channel the message is in */
	channelId: Snowflake;
	/** the id of the character the message is from */
	characterId: Snowflake;
	/** the id of the game the message is in */
	gameId?: Snowflake;
	/** the id of the guild the message is in */
	guildId: Snowflake;
	/** the id of the message */
	id: Snowflake;
	/** the ids of the messages from a dialog that was too long and split over multiple messages */
	messageIds: Snowflake[];
	/** the timestamp of the message */
	timestamp: number;
	/** the id of the user that posted the dialog */
	userId: Snowflake;
};

type CoreResolvable = DialogMessageDataCore | TDialogMessage;

function updateCore(core: CoreResolvable): DialogMessageDataCore {
	if ("messageDid" in core) {
		return {
			channelId: isNonNilSnowflake(core.threadDid) ? core.channelDid : core.threadDid,
			characterId: core.characterId,
			gameId: core.gameId,
			guildId: core.serverDid,
			id: core.messageDid,
			messageIds: [core.messageDid],
			timestamp: core.timestamp,
			userId: core.userDid
		};
	}
	return core;
}

type MessageResolvable = Message | PartialMessage | MessageReference;

function toMessageReference(resolvable: MessageResolvable): MessageReference {
	const { channelId, guildId } = resolvable;
	const messageId = "id" in resolvable ? resolvable.id : resolvable.messageId;
	return { channelId, guildId: guildId ?? undefined, messageId };
}

export class DialogMessageData {
	public constructor(private readonly core: DialogMessageDataCore) { }

	public get channelId(): Snowflake { return this.core.channelId; }
	public get characterId(): Snowflake { return this.core.characterId; }
	public get gameId(): Snowflake | undefined { return this.core.gameId; }
	public get guildId(): Snowflake { return this.core.guildId; }
	public get id(): Snowflake { return this.core.id; }
	public get messageIds(): Snowflake[] { return this.core.messageIds; }
	public get timestamp(): number { return this.core.timestamp; }
	public get userId(): Snowflake { return this.core.userId; }

	public matchesChannel(resolvable: MessageResolvable | string): boolean {
		return this.channelId === (typeof(resolvable) === "string" ? resolvable : resolvable.channelId);
	}

	// public matchesMessage(resolvable: MessageResolvable): boolean {
	// 	return this.id === ("id" in resolvable ? resolvable.id : resolvable.messageId);
	// }

	public toMessageReference(): MessageReference {
		return {
			channelId: this.channelId,
			guildId: this.guildId,
			messageId: this.id
		};
	}

	public toJSON(): DialogMessageDataCore {
		return this.core;
	}

	public static fromCore(core: CoreResolvable): DialogMessageData {
		return new DialogMessageData(updateCore(core));
	}

}

type WriteArgs = {
	messages: Message[],
	characterId: Snowflake,
	gameId?: Snowflake,
	userId: Snowflake
};

export class DialogMessageRepository {

	public static async read(resolvable: MessageResolvable, options?: { ignoreMissingFile?: boolean }): Promise<DialogMessageData | undefined> {
		const root = getDataRoot("sage/messages");
		const returnUndefined = () => undefined;

		// we might need to fetch a partial later, so let's not make this a const
		let messageReference = toMessageReference(resolvable);
		const { messageId } = messageReference;

		// try reading the new file format that is just messageId
		let fileName = `${messageId}.json`;
		let core = await readJsonFile<DialogMessageDataCore>(`${root}/${fileName}`).catch(returnUndefined);

		// we didn't get one from the new file format, so let's fallback on the old
		if (!core) {
			// if we get here with a partial, fetch it so that we can get the valid guildId
			if ("partial" in resolvable && resolvable.partial) {
				resolvable = await resolvable.fetch();
				messageReference = toMessageReference(resolvable);
			}

			// get guildId now that we are sure we have a valid result
			const { guildId } = messageReference;

			// try reading the old file format using guildId-messageId
			fileName = `${orNilSnowflake(guildId)}-${messageId}.json`;
			core = await readJsonFile<DialogMessageDataCore>(`${root}/${fileName}`).catch(options?.ignoreMissingFile ? returnUndefined : errorReturnNull);
		}

		// we have found the data, return the instance
		if (core) {
			return DialogMessageData.fromCore(core);
		}

		return undefined;
	}

	public static async write({ characterId, gameId, messages, userId }: WriteArgs): Promise<DialogMessageData | undefined> {
		const root = getDataRoot("sage/messages");

		let lastCore: DialogMessageDataCore | undefined;

		// grab all teh message ids first
		const messageIds = messages.map(msg => msg.id as Snowflake);

		// we need to write a DialogMessageData for each message of a multi-message dialog for use with DialogLookup
		for (const message of messages) {
			// if we somehow get here with a partial, fetch it
			if (message.partial) {
				await message.fetch();
			}

			// create the core
			const core: DialogMessageDataCore = {
				channelId: message.channel.id as Snowflake,
				characterId,
				gameId,
				id: message.id as Snowflake,
				guildId: message.guild?.id as Snowflake,
				messageIds,
				timestamp: message.createdTimestamp,
				userId
			};

			// attempt to save and track the last core
			const success = await writeFile(`${root}/${message.id}.json`, core).catch(errorReturnFalse);
			if (success) {
				lastCore = core;
			}
		}

		// return the last core
		if (lastCore) {
			return DialogMessageData.fromCore(lastCore);
		}

		// return nothing
		return undefined;
	}

}
