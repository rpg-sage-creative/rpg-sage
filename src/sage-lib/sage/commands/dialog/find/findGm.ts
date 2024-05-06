import { GameCharacter, type GameCharacterCore } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { findNpc } from "./findNpc.js";

/** Finds the Game Master NPC, using the saved name or the default name, creating one if not found and the user is a GameMaster. */
export async function findGm(sageCommand: SageCommand): Promise<GameCharacter | undefined> {
	if (sageCommand.game) {
		if (sageCommand.isGameMaster) {
			const gmCharacterName = sageCommand.game.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
			const gm = findNpc(sageCommand, gmCharacterName);
			if (gm) {
				return gm;
			}
			const added = await sageCommand.game.nonPlayerCharacters.addCharacter({ name: gmCharacterName } as GameCharacterCore);
			return added ?? undefined;
		}
		return undefined;
	}
	const defaultGmCharacterName = sageCommand.server?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
	return new GameCharacter({ name: defaultGmCharacterName } as GameCharacterCore);
}