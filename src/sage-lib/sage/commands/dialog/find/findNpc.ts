import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";

export function findNpc(sageCommand: SageCommand, npcName: string): GameCharacter | undefined {
	if (sageCommand.gameChannel && sageCommand.isGameMaster) {
			return sageCommand.game!.nonPlayerCharacters.findByName(npcName)
				?? sageCommand.game!.nonPlayerCharacters.findCompanionByName(npcName);
	}
	return sageCommand.sageUser.nonPlayerCharacters.findByName(npcName)
		?? sageCommand.sageUser.nonPlayerCharacters.findByCompanionName(npcName);
}