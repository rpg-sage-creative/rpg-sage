import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import { registerGame as _registerGame } from "./game.js";
import { gCmdArchive } from "./gCmdArchive.js";
import { gCmdCreate } from "./gCmdCreate.js";
import { gCmdDetails } from "./gCmdDetails.js";
import { gCmdUpdate } from "./gCmdUpdate.js";
import { registerRole } from "./role.js";
// import registerWizard from "./wizard";

export function registerGame(): void {
	_registerGame();
	registerRole();
	// registerWizard();

	registerListeners({ commands:["game|create", "create|game"], interaction:gCmdCreate, message:gCmdCreate });
	registerListeners({ commands:["game|details", "Game Details"], interaction:gCmdDetails, message:gCmdDetails });
	registerListeners({ commands:["game|update", "update|game"], interaction:gCmdUpdate, message:gCmdUpdate });
	registerListeners({ commands:["game|archive", "archive|game"], interaction:gCmdArchive, message:gCmdArchive });
}
