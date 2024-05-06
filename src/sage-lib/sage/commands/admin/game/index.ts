import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { registerGame as _registerGame } from "./game.js";
import { gCmdArchive } from "./gCmdArchive.js";
import { gCmdCreate } from "./gCmdCreate.js";
import { gCmdDetails } from "./gCmdDetails.js";
import { gCmdUpdate } from "./gCmdUpdate.js";
import { registerRole } from "./role.js";
// import registerWizard from "./wizard";

async function gameHelp(sageCommand: SageCommand): Promise<void> {
	const messages: { isHelp?:boolean; message?:string; page:string; label?:string; }[] = [];
	if (sageCommand.isCommand("game")) {
		const isHelp = sageCommand.isCommand("game", "help");
		messages.push({ isHelp, page:"Game-Management" });

	}else if (sageCommand.isCommand("gm")) {
		const isHelp = sageCommand.isCommand("gm", "help");
		messages.push({ isHelp, message:`If you are trying to manage a Game's Game Masters:`, page:"Game-Management#game-masters" });

	}else if (sageCommand.isCommand("player")) {
		const isHelp = sageCommand.isCommand("player", "help");
		messages.push({ isHelp, message:`If you are trying to manage a Game's Players:`, page:"Game-Management#players" });

	}
	await sageCommand.whisperWikiHelp(...messages);
}

export function registerGame(): void {
	_registerGame();
	registerRole();
	// registerWizard();

	registerListeners({ commands:["game|create", "create|game"], interaction:gCmdCreate, message:gCmdCreate });
	registerListeners({ commands:["game|details", "Game Details"], interaction:gCmdDetails, message:gCmdDetails });
	registerListeners({ commands:["game|update", "update|game"], interaction:gCmdUpdate, message:gCmdUpdate });
	registerListeners({ commands:["game|archive", "archive|game"], interaction:gCmdArchive, message:gCmdArchive });
	registerListeners({ commands:["game", "game|help", "gm", "gm|help", "player", "player|help"], handler:gameHelp });
}
