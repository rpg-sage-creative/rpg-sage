import { GameCharacter, type GameCharacterCore } from "../../../model/GameCharacter";
import type { SageMessage } from "../../../model/SageMessage";
import { findNpc } from "./findNpc";

/** Finds the Game Master NPC, using the saved name or the default name, creating one if not found and the user is a GameMaster. */
export async function findGm(sageMessage: SageMessage): Promise<GameCharacter | undefined> {
	if (sageMessage.game) {
		if (sageMessage.isGameMaster) {
			const gmCharacterName = sageMessage.game.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
			const gm = findNpc(sageMessage, gmCharacterName);
			if (gm) {
				return gm;
			}
			const added = await sageMessage.game.nonPlayerCharacters.addCharacter({ name: gmCharacterName } as GameCharacterCore);
			return added ?? undefined;
		}
		return undefined;
	}
	const defaultGmCharacterName = sageMessage.server?.defaultGmCharacterName ?? GameCharacter.defaultGmCharacterName;
	return new GameCharacter({ name: defaultGmCharacterName } as GameCharacterCore);
}