import type SageMessage from "../../../model/SageMessage";
import { registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";
import { gameUserList } from "./player";

async function listGameMasters(sageMessage: SageMessage): Promise<void> {
	return gameUserList(sageMessage, "Game Masters", sageMessage.game?.gameMasters);
}

async function addGameMaster(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("Add Game Master");
	if (denial) {
		return denial;
	}

	const users = Array.from(sageMessage.message.mentions.users.values());
	const added = await sageMessage.game!.addGameMasters(users.map(user => user.id));
	return sageMessage.reactSuccessOrFailure(added, "Game Master Added.", "Unknown Error; Game Master NOT Added!");
}

async function removeGameMaster(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("Remove Game Master");
	if (denial) {
		return denial;
	}

	const users = Array.from(sageMessage.message.mentions.users.values());
	const removed = await sageMessage.game!.removeGameMasters(users.map(user => user.id));
	return sageMessage.reactSuccessOrFailure(removed, "Game Master Removed.", "Unknown Error; Game Master NOT Removed!");
}

export default function register(): void {
	registerAdminCommand(listGameMasters, "gm-list", "gms-list");
	registerAdminCommandHelp("Admin", "GM", "gm list");

	registerAdminCommand(addGameMaster, "gm-add", "gms-add");
	registerAdminCommandHelp("Admin", "GM", "gm add @UserMention");

	registerAdminCommand(removeGameMaster, "gm-remove", "gms-remove");
	registerAdminCommandHelp("Admin", "GM", "gm remove @UserMention");
}
