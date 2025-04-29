import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import { GameCharacter } from "../../../../model/GameCharacter.js";
import type { SageCommand } from "../../../../model/SageCommand.js";

type CharId = Snowflake | UUID | string;

export async function getCharToEdit(sageCommand: SageCommand, charId: CharId): Promise<GameCharacter | undefined> {
	const game = sageCommand.game;
	const gameId = game?.id;
	const userId = sageCommand.authorDid;

	const char = await GameCharacter.fromTemp({ charId, gameId, userId });
	if (char) {
		return char;
	}

	const charOrShell = (game ?? sageCommand.sageUser).findCharacterOrCompanion(charId);
	if (charOrShell) {
		return "game" in charOrShell ? charOrShell.game : charOrShell;
	}
	return undefined;
}