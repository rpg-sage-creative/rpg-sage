import type { Snowflake } from "discord.js";
import { errorReturnFalse, errorReturnNull } from "../../../sage-utils/ConsoleUtils";
import { isNilSnowflake } from "../../../sage-utils/SnowflakeUtils";
import { DiscordKey,  DiscordKeyCore, TDiscordKeyResolvable } from "../../../sage-utils/DiscordUtils";
import { readJsonFile, writeFile } from "../../../sage-utils/FsUtils";
import { cleanJson } from "../../../sage-utils/JsonUtils";
import { IdRepository } from "./base/IdRepository";
import { NIL_UUID, UUID } from "../../../sage-utils/UuidUtils";

type SageKeyCore = {
	bot?: UUID;
	character?: UUID;
	game?: UUID;
	server?: UUID;
	user?: UUID;
}

/** @todo consider using sageKey as { bot, server, game user, character } ? */
export type TDialogMessage = {
	/** represents server, category, channel, thread, message */
	discordKey: DiscordKeyCore;
	/** represents bot, character, game, server, user */
	sageKey: SageKeyCore;
	timestamp: number;
	userDid?: Snowflake;
};

//#region obsolete

// export type TObsoleteDialogMessage = TDialogMessage & {
// 	characterId?: UUID;
// 	gameId?: UUID;
// 	serverId?: UUID;

// 	/** @deprecated Use .discordKey?.category */
// 	categoryDid?: Snowflake;

// 	/** @deprecated Use .discordKey?.channel */
// 	channelDid?: Snowflake;

// 	/** @deprecated Use .discordKey?.message */
// 	messageDid?: Snowflake;

// 	/** @deprecated Use .discordKey?.server */
// 	serverDid?: Snowflake;

// 	/** @deprecated Use .discordKey?.thread */
// 	threadDid?: Snowflake;

// };

//#endregion

function toPath(discordKey: TDiscordKeyResolvable): string {
	const root = IdRepository.DataPath;
	const file = DiscordKey.toShortKey(discordKey);
	return `${root}/messages/${file}.json`;
}

export class DialogMessageRepository {
	/**
	 * @deprecated
	 * This is a stop-gap solution.
	 * When this code is implemented, all new DialogMessages will contain a proper DiscordKeyCore.
	 * Once implemented, it might be worthwhile to create a script to update all the old data so that we can remove this.
	*/
	public static ensureDiscordKey<T extends TDialogMessage | null | undefined>(dialogMessage: T): T {
		if (dialogMessage) {
			if (!dialogMessage.discordKey) {
				const discordKey = { } as DiscordKeyCore;
				const discordKeyKeys = ["server","category","channel","thread","message"] as (keyof DiscordKeyCore)[];
				discordKeyKeys.forEach(discordKeyKey => {
					const dialogMessageKey = `${discordKeyKey}Did` as keyof TDialogMessage;
					const snowflake = dialogMessage[dialogMessageKey] as Snowflake | undefined;
					discordKey[discordKeyKey] = isNilSnowflake(snowflake) ? undefined : snowflake ?? undefined;
					delete dialogMessage[dialogMessageKey];
				});
				dialogMessage.discordKey = cleanJson(discordKey);
			}
			if (!dialogMessage.sageKey) {
				const sageKey = { } as SageKeyCore;
				const sageKeyKeys = ["character","game","server"] as (keyof SageKeyCore)[];
				sageKeyKeys.forEach(sageKeyKey => {
					const dialogMessageKey = `${sageKeyKey}Id` as keyof TDialogMessage;
					const uuid = dialogMessage[dialogMessageKey] as UUID | undefined;
					sageKey[sageKeyKey] = uuid === NIL_UUID ? undefined : uuid as UUID ?? undefined;
					delete dialogMessage[dialogMessageKey];
				});
				dialogMessage.sageKey = cleanJson(sageKey);
			}
		}
		return dialogMessage;
	}

	public static async read(discordKey: TDiscordKeyResolvable, catcher = errorReturnNull): Promise<TDialogMessage | null> {
		const path = toPath(discordKey);
		const dialogMessage = await readJsonFile<TDialogMessage>(path).catch(catcher);
		return this.ensureDiscordKey(dialogMessage);
	}

	public static async write(dialogMessage: TDialogMessage): Promise<boolean>;
	public static async write(dialogMessage: TDialogMessage, discordKey: DiscordKey): Promise<boolean>;
	public static async write(dialogMessage: TDialogMessage, discordKey?: DiscordKey): Promise<boolean> {
		if (discordKey?.isValid) {
			dialogMessage.discordKey = discordKey.toJSON();
		}
		const path = toPath(dialogMessage.discordKey);
		return writeFile(path, dialogMessage).catch(errorReturnFalse);
	}
}
