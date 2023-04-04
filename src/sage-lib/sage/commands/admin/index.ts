import { register as registerBot } from "./bot";
import { register as registerChannel } from "./channel";
import { register as registerColor } from "./color";
import { register as registerEmoji } from "./emoji";
import { register as registerGame } from "./game/index";
import { register as registerGameCharacter } from "./gameCharacter";
import { register as registerNote } from "./note";
import { register as registerPatreon } from "./patreon";
import { register as registerServer } from "./server/index";
import { register as registerUser } from "./user/index";

export function register(): void {
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
