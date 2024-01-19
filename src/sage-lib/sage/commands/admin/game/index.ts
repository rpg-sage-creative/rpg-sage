import { registerGame as _registerGame } from "./game.js";
import { registerGameMaster } from "./gameMaster.js";
import { registerPlayer } from "./player.js";
import { registerRole } from "./role.js";
// import registerWizard from "./wizard";

export function registerGame(): void {
	_registerGame();
	registerGameMaster();
	registerPlayer();
	registerRole();
	// registerWizard();
}
