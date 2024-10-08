import { registerBot } from "./bot.js";
import { registerChannel } from "./channel.js";
import { registerColor } from "./color.js";
import { registerEmoji } from "./emoji.js";
import { registerGame } from "./game";
import { registerGameCharacter } from "./gameCharacter.js";
import { registerServer } from "./server/index.js";
import { registerUser } from "./user/index.js";

export function registerAdmin(): void {
	registerBot();
	registerChannel();
	registerColor();
	registerEmoji();
	registerGame();
	registerGameCharacter();
	registerServer();
	registerUser();
}
