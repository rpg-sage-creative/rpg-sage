import { errorReturnFalse, errorReturnNull, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordKey } from "@rsc-utils/discord-utils";
import { readJsonFile, writeFile } from "@rsc-utils/io-utils";
import type { MessageReference } from "discord.js";
import type { TDialogMessage } from "../model/GameCharacter";
import { IdRepository } from "./base/IdRepository";

function toPath(keyOrRef: DiscordKey | MessageReference): string {
	const fileName = keyOrRef instanceof DiscordKey
		? keyOrRef.shortKey
		: DiscordKey.createKey(keyOrRef.guildId as Snowflake, keyOrRef.messageId as Snowflake);
	return `${IdRepository.DataPath}/messages/${fileName}.json`;
}

export class DialogMessageRepository {
	public static async read(keyOrRef: DiscordKey | MessageReference, options?: { ignoreMissingFile?: boolean }): Promise<TDialogMessage | null> {
		const path = toPath(keyOrRef);
		const catcher = options?.ignoreMissingFile ? () => null : errorReturnNull;
		return readJsonFile<TDialogMessage>(path).catch(catcher);
	}
	public static async write(discordKey: DiscordKey, dialogMessage: TDialogMessage): Promise<boolean> {
		const path = toPath(discordKey);
		return writeFile(path, dialogMessage).catch(errorReturnFalse);
	}
}
