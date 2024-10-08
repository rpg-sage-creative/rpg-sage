import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { CharacterManager } from "../../../model/CharacterManager.js";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { Names } from "../../../model/SageCommandArgs.js";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta.js";

/** Reusable code to get GameCharacter for the commands. */
export async function getCharacter(sageCommand: SageCommand, characterTypeMeta: TCharacterTypeMeta, userId: Optional<Snowflake>, names: Names, alias?: string): Promise<GameCharacter | undefined> {
	if (characterTypeMeta.isGm) {
		return sageCommand.gmCharacter;
	}

	const hasCharacters = sageCommand.game ?? sageCommand.sageUser;

	let characterManager: CharacterManager | undefined = characterTypeMeta.isGmOrNpcOrMinion
		? hasCharacters.nonPlayerCharacters
		: hasCharacters.playerCharacters;

	if (characterTypeMeta.isCompanion) {
		characterManager = characterManager?.findByUser(userId, names.charName)?.companions;
	}else if (characterTypeMeta.isMinion) {
		characterManager = characterManager?.findByName(names.charName)?.companions;
	}

	return characterManager?.findByName(names.oldName ?? names.name)
		?? characterManager?.findByName(alias);
}
