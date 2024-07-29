import { registerBot } from "./bot.js";
import { registerChannel } from "./channel.js";
import { registerColor } from "./color.js";
import { registerEmoji } from "./emoji.js";
import { registerGame } from "./game";
import { registerGameCharacter } from "./gameCharacter.js";
import { registerNote } from "./note.js";
import { registerServer } from "./server";
import { registerUser } from "./user";

export function registerAdmin(): void {
	registerBot();
	registerChannel();
	registerColor();
	registerEmoji();
	registerGame();
	registerGameCharacter();
	registerNote();
	registerServer();
	registerUser();
}
