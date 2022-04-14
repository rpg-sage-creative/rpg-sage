import registerGame from "./game";
import registerGameMaster from "./gameMaster";
import registerPlayer from "./player";
import registerRole from "./role";
// import registerWizard from "./wizard";

export default function register(): void {
	registerGame();
	registerGameMaster();
	registerPlayer();
	registerRole();
	// registerWizard();
}
