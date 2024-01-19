import { GameCharacter } from "../../../model/GameCharacter";
import { SageMessage } from "../../../model/SageMessage";

export function findNpc(sageMessage: SageMessage, npcName: string): GameCharacter | undefined {
	if (sageMessage.gameChannel && sageMessage.isGameMaster) {
			return sageMessage.game!.nonPlayerCharacters.findByName(npcName)
				?? sageMessage.game!.nonPlayerCharacters.findCompanionByName(npcName);
	} else if (!sageMessage.channel || sageMessage.channel.dialog) {
		return sageMessage.sageUser.nonPlayerCharacters.findByName(npcName);
	}
	return undefined;
}