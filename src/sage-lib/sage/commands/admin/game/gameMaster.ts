import { parseIds } from "@rsc-utils/discord-utils";
import type { SageMessage } from "../../../model/SageMessage";
import { registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";
import { gameUserList } from "./player";

async function listGameMasters(sageMessage: SageMessage): Promise<void> {
	return gameUserList(sageMessage, "Game Masters", sageMessage.game?.gameMasters);
}

async function addGameMaster(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const users = Array.from(sageMessage.message.mentions.users.values());
	const added = await sageMessage.game!.addGameMasters(users.map(user => user.id));
	return sageMessage.reactSuccessOrFailure(added);
}

async function removeGameMaster(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const possibleUserIds = parseIds(sageMessage.message, "user", true);
	const added = await sageMessage.game!.removeGameMasters(possibleUserIds);
	return sageMessage.reactSuccessOrFailure(added);
}

export function registerGameMaster(): void {
	registerAdminCommand(listGameMasters, "gm-list", "gms-list");
	registerAdminCommandHelp("Admin", "GM", "gm list");

	registerAdminCommand(addGameMaster, "gm-add", "gms-add");
	registerAdminCommandHelp("Admin", "GM", "gm add @UserMention");

	registerAdminCommand(removeGameMaster, "gm-remove", "gms-remove");
	registerAdminCommandHelp("Admin", "GM", "gm remove @UserMention");
}
