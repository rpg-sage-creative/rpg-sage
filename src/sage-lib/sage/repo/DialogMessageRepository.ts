import { errorReturnFalse, errorReturnNull } from "@rsc-utils/console-utils";
import { readJsonFile, writeFile } from "@rsc-utils/fs-utils";
import type { DiscordKey } from "../../discord";
import type { TDialogMessage } from "../model/GameCharacter";
import IdRepository from "./base/IdRepository";

function toPath(discordKey: DiscordKey): string {
	return `${IdRepository.DataPath}/messages/${discordKey.shortKey}.json`;
}

export default class DialogMessageRepository {
	public static async read(discordKey: DiscordKey, catcher = errorReturnNull): Promise<TDialogMessage | null> {
		const path = toPath(discordKey);
		return readJsonFile<TDialogMessage>(path).catch(catcher);
	}
	public static async write(discordKey: DiscordKey, dialogMessage: TDialogMessage): Promise<boolean> {
		const path = toPath(discordKey);
		return writeFile(path, dialogMessage).catch(errorReturnFalse);
	}
}
