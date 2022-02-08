import utils from "../../../sage-utils";
import type { DiscordKey } from "../../discord";
import type { TDialogMessage } from "../model/GameCharacter";
import IdRepository from "./base/IdRepository";

export default class DialogMessageRepository {
	public static async read(discordKey: DiscordKey): Promise<TDialogMessage | null> {
		return utils.FsUtils.readJsonFile<TDialogMessage>(`${IdRepository.DataPath}/messages/${discordKey.shortKey}.json`)
			.catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	}
	public static async write(discordKey: DiscordKey, dialogMessage: TDialogMessage): Promise<boolean> {
		const path = `${IdRepository.DataPath}/messages/${discordKey.shortKey}.json`;
		return utils.FsUtils.writeFile(path, dialogMessage)
			.catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
	}
}
