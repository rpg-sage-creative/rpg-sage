import type { Optional } from "../../../../../sage-utils";
import { isBlank } from "../../../../../sage-utils/utils/StringUtils";
import type CharacterManager from "../../../model/CharacterManager";
import type GameCharacter from "../../../model/GameCharacter";
import type SageMessage from "../../../model/SageMessage";

export function findCompanion(sageMessage: SageMessage, companionNameOrIndex: Optional<string>): GameCharacter | undefined {
	let companions: CharacterManager | undefined;
	if (sageMessage.gameChannel) {
		companions = sageMessage.playerCharacter?.companions;
	} else if (!sageMessage.channel || sageMessage.channel.dialog) {
		// Currently only allow a single PC per server outside of games
		companions = sageMessage.sageUser.playerCharacters.first()?.companions;
	}
	if (companions) {
		if (isBlank(companionNameOrIndex)) {
			return companions.first();
		}
		return companions.findByNameOrIndex(companionNameOrIndex);
	}
	return undefined;
}