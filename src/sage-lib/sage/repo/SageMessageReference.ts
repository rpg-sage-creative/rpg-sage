import { error, errorReturnFalse, errorReturnUndefined, getDataRoot, snowflakeToDate, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { readJsonFile, writeFile } from "@rsc-utils/io-utils";
import type { Message, MessageReference, PartialMessage } from "discord.js";

export type SageMessageReferenceCore = {
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
	ts: number;
	/** the id of the user that posted the dialog */
	userId: Snowflake;
	/** All SageCore objects include id, objectType, and ver */
	ver: number;
};

type ReadOptions = {
	ignoreMissingFile?: boolean;
};

type WriteArgs = {
	messages: Message[];
	characterId: Snowflake;
	gameId?: Snowflake;
	userId: Snowflake;
};

type MessageResolvable = Message | PartialMessage | MessageReference;

function createFilePath(messageId: string): string {
	const root = getDataRoot("sage/messages");
	const year = snowflakeToDate(messageId as Snowflake).getFullYear();
	return `${root}/${year}/${messageId}.json`;
}

export class SageMessageReference {
	public constructor(private readonly core: SageMessageReferenceCore) { }

	public get channelId(): Snowflake { return this.core.channelId; }
	public get characterId(): Snowflake { return this.core.characterId; }
	public get gameId(): Snowflake | undefined { return this.core.gameId; }
	public get guildId(): Snowflake { return this.core.guildId; }
	public get id(): Snowflake { return this.core.id; }
	public get messageIds(): Snowflake[] { return this.core.messageIds; }
	public get objectType(): "Message" { return this.core.objectType; }
	public get ts(): number { return this.core.ts; }
	public get userId(): Snowflake { return this.core.userId; }
	public get ver(): number { return this.core.ver; }

	public matchesChannel(resolvable: Optional<SageMessageReferenceCore | MessageResolvable | string>): boolean {
		if (typeof (resolvable) === "string") {
			return this.channelId === resolvable;
		}
		return this.channelId === resolvable?.channelId;
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

	public toJSON(): SageMessageReferenceCore {
		return this.core;
	}

	public static fromCore(core: SageMessageReferenceCore): SageMessageReference {
		return new SageMessageReference(core);
	}

	public static async read(resolvable: MessageResolvable, options?: ReadOptions): Promise<SageMessageReference | undefined> {
		const messageId = "id" in resolvable ? resolvable.id : resolvable.messageId;
		if (!messageId) {
			error(`DialogMessageRepository.read(): resolvable doesn't have message id`);
			return undefined;
		}

		const filePath = createFilePath(messageId);
		const catcher = options?.ignoreMissingFile ? () => undefined : errorReturnUndefined;
		const core = await readJsonFile<SageMessageReferenceCore>(filePath).catch(catcher) ?? undefined;

		return core ? new SageMessageReference(core) : undefined;
	}

	public static async write({ characterId, gameId, messages, userId }: WriteArgs): Promise<SageMessageReference | undefined> {
		let lastCore: SageMessageReferenceCore | undefined;

		// grab all the message ids first
		const messageIds = messages.map(msg => msg.id as Snowflake);

		// we need to write a DialogMessageData for each message of a multi-message dialog for use with DialogLookup
		for (const message of messages) {
			// if we somehow get here with a partial, fetch it
			if (message.partial) {
				await message.fetch();
			}

			// create the core
			const core: SageMessageReferenceCore = {
				channelId: message.channel.id as Snowflake,
				characterId,
				gameId,
				id: message.id as Snowflake,
				guildId: message.guild?.id as Snowflake,
				messageIds,
				objectType: "Message",
				ts: snowflakeToDate(message.id as Snowflake).getTime(),
				userId,
				ver: 1
			};

			// attempt to save and track the last core
			const filePath = createFilePath(message.id);
			const success = await writeFile(filePath, core).catch(errorReturnFalse);
			if (success) {
				lastCore = core;
			}
		}

		// return the last core
		if (lastCore) {
			return SageMessageReference.fromCore(lastCore);
		}

		// return nothing
		return undefined;
	}
}
