import utils from "../../../sage-utils";
import type { DiscordKey } from "../../discord";
import type { TDialogMessage } from "../model/GameCharacter";
import IdRepository from "./base/IdRepository";

function toPath(discordKey: DiscordKey): string {
	return `${IdRepository.DataPath}/messages/${discordKey.shortKey}.json`;
}

export default class DialogMessageRepository {
	public static async read(discordKey: DiscordKey): Promise<TDialogMessage | null> {
		const path = toPath(discordKey);
		return utils.FsUtils.readJsonFile<TDialogMessage>(path)
			.catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	}
	public static async write(discordKey: DiscordKey, dialogMessage: TDialogMessage): Promise<boolean> {
		const path = toPath(discordKey);
		return utils.FsUtils.writeFile(path, dialogMessage)
			.catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
	}
}
