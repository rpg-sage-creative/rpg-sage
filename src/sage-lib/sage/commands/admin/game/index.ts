import { register as registerGame } from "./game";
import { register as registerGameMaster } from "./gameMaster";
import { register as registerPlayer } from "./player";
import { register as registerRole } from "./role";
// import { registerWizard } from "./wizard";

export function register(): void {
	registerGame();
	registerGameMaster();
	registerPlayer();
	registerRole();
	// registerWizard();
}
