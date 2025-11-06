import { error, errorReturnFalse, errorReturnUndefined, getDataRoot, isNonNilSnowflake, orNilSnowflake, snowflakeToDate, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { deleteFile, readJsonFile, writeFile } from "@rsc-utils/io-utils";
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
	/** All SageCore objects include id, objectType, and ver */
	objectType: "Message";
	/** the timestamp of the message */
	timestamp: number;
	/** the id of the user that posted the dialog */
	userId: Snowflake;
	/** All SageCore objects include id, objectType, and ver */
	ver: number;
};

export type SageMessageResolvable = DialogMessageDataCore | TDialogMessage;

export function updateSageMessage(core: SageMessageResolvable): DialogMessageDataCore {
	if ("messageDid" in core) {
		return {
			channelId: isNonNilSnowflake(core.threadDid) ? core.threadDid : core.channelDid,
			characterId: core.characterId,
			gameId: core.gameId,
			guildId: core.serverDid,
			id: core.messageDid,
			messageIds: [core.messageDid],
			objectType: "Message",
			timestamp: snowflakeToDate(core.messageDid).getTime(),
			userId: core.userDid,
			ver: 1
		};
	}

	const timestamp = snowflakeToDate(core.id).getTime();
	if (core.objectType !== "Message" || !core.ver || core.timestamp !== timestamp) {
		return { ...core as any, objectType:"Message", timestamp, ver:1 };
	}
	return core;
}

type MessageResolvable = Message | PartialMessage | MessageReference;

function toMessageReference(resolvable: MessageResolvable): MessageReference {
	const { channelId, guildId } = resolvable;
	const messageId = "id" in resolvable ? resolvable.id : resolvable.messageId;
	const type: number = resolvable.type ?? 0;
	return { channelId, guildId: guildId ?? undefined, messageId, type };
}

export class DialogMessageData {
	public constructor(private readonly core: DialogMessageDataCore) { }

	public get channelId(): Snowflake { return this.core.channelId; }
	public get characterId(): Snowflake { return this.core.characterId; }
	public get gameId(): Snowflake | undefined { return this.core.gameId; }
	public get guildId(): Snowflake { return this.core.guildId; }
	public get id(): Snowflake { return this.core.id; }
	public get messageIds(): Snowflake[] { return this.core.messageIds; }
	public get objectType(): "Message" { return this.core.objectType; }
	public get timestamp(): number { return this.core.timestamp; }
	public get userId(): Snowflake { return this.core.userId; }
	public get ver(): number { return this.core.ver; }

	public matchesChannel(resolvable: Optional<SageMessageResolvable | MessageResolvable | string>): boolean {
		// we got an undefined somehow, somewhere, so handle it
		if (!resolvable) {
			return false;
		}

		// handle string
		if (typeof (resolvable) === "string") {
			return this.channelId === resolvable;
		}

		// old cores might still exist, so lets update them
		if ("messageDid" in resolvable) {
			resolvable = updateSageMessage(resolvable);
		}

		return this.channelId === resolvable.channelId;
	}

	// public matchesMessage(resolvable: MessageResolvable): boolean {
	// 	return this.id === ("id" in resolvable ? resolvable.id : resolvable.messageId);
	// }

	public toMessageReference(): MessageReference {
		return {
			channelId: this.channelId,
			guildId: this.guildId,
			messageId: this.id,
			type: 0
		};
	}

	public toJSON(): DialogMessageDataCore {
		return this.core;
	}

	public static fromCore(core: SageMessageResolvable): DialogMessageData {
		return new DialogMessageData(updateSageMessage(core));
	}

}

type WriteArgs = {
	messages: Message[];
	characterId: Snowflake;
	gameId?: Snowflake;
	userId: Snowflake;
};

function createFilePathV2(messageId: string): string {
	const root = getDataRoot("sage/messages");
	const year = snowflakeToDate(messageId as Snowflake).getFullYear();
	return `${root}/${year}/${messageId}.json`;
}
function createFilePathV1(messageId: string): string {
	const root = getDataRoot("sage/messages");
	return `${root}/${messageId}.json`;
}
function createFilePathV0(messageId: string, guildId?: string): string {
	const root = getDataRoot("sage/messages");
	if (guildId) {
		// v0 format
		return `${root}/${orNilSnowflake(guildId)}-${messageId}.json`;
	} else {
		// v1 format
		return `${root}/${messageId}.json`;
	}
}

export class DialogMessageRepository {

	public static async read(resolvable: MessageResolvable, options?: { ignoreMissingFile?: boolean }): Promise<DialogMessageData | undefined> {
		const returnUndefined = () => undefined;

		let core: DialogMessageDataCore | undefined;

		// we might need to fetch a partial later, so let's not make this a const
		let messageReference = toMessageReference(resolvable);
		const { messageId } = messageReference;

		if (!messageId) {
			error(`DialogMessageRepository.read(): resolvable doesn't have message id`);
			return undefined;
		}

		// try reading the v2 file format that uses year
		const filePathV2 = createFilePathV2(messageId);
		core = await readJsonFile<DialogMessageDataCore>(filePathV2).catch(returnUndefined) ?? undefined;

		// flag to update old data or not
		let update = false;
		let filePathV1: string | undefined;
		let filePathV0: string | undefined;

		// we didn't get one from v2 file format, so let's fallback on the v1
		if (!core) {
			filePathV1 = createFilePathV1(messageId);
			core = await readJsonFile<DialogMessageDataCore>(filePathV1).catch(returnUndefined) ?? undefined;
			update = core !== undefined;
		}

		// we didn't get one from v2 nor v1 file format, so let's fallback on the old v0
		if (!core) {
			// see if we already have a guildId
			let guildId = messageReference.guildId ?? resolvable.guildId;

			// if we get here with a partial, fetch it so that we can get the valid guildId
			if (!guildId && "partial" in resolvable && resolvable.partial) {
				resolvable = await resolvable.fetch();
				messageReference = toMessageReference(resolvable);
				guildId = messageReference.guildId;
			}

			if (!guildId) {
				error(`DialogMessageRepository.read(): resolvable doesn't have guildId`);
				return undefined;
			}

			filePathV0 = createFilePathV0(messageId, guildId);
			core = await readJsonFile<DialogMessageDataCore>(filePathV0).catch(options?.ignoreMissingFile ? returnUndefined : errorReturnUndefined) ?? undefined;
			update = core !== undefined;
		}

		// we have found the data
		if (core) {
			if (update) {
				// update the old core
				core = updateSageMessage(core);

				// write the updated core to the new file
				const success = await writeFile(filePathV2, core).catch(errorReturnFalse);

				// delete the old file
				if (success) {
					if (filePathV0) await deleteFile(filePathV0);
					if (filePathV1) await deleteFile(filePathV1);
				}
			}

			// return the instance
			return DialogMessageData.fromCore(core);
		}

		return undefined;
	}

	public static async write({ characterId, gameId, messages, userId }: WriteArgs): Promise<DialogMessageData | undefined> {
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
				objectType: "Message",
				timestamp: message.createdTimestamp,
				userId,
				ver: 1
			};

			// attempt to save and track the last core
			const filePath = createFilePathV2(message.id);
			const success = await writeFile(filePath, core).catch(errorReturnFalse);
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
