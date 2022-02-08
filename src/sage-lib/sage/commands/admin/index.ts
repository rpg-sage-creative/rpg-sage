import registerBot from "./bot";
import registerChannel from "./channel";
import registerColor from "./color";
import registerEmoji from "./emoji";
import registerGame from "./game/index";
import registerGameCharacter from "./gameCharacter";
import registerNote from "./note";
import registerPatreon from "./patreon";
import registerServer from "./server/index";
import registerUser from "./user/index";

export default function register(): void {
	registerBot();
	registerChannel();
	registerColor();
	registerEmoji();
	registerGame();
	registerGameCharacter();
	registerNote();
	registerPatreon();
	registerServer();
	registerUser();
}
