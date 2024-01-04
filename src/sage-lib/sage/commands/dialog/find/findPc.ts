import type { Optional } from "../../../../../sage-utils";
import { isBlank } from "../../../../../sage-utils/utils/StringUtils";
import type GameCharacter from "../../../model/GameCharacter";
import type SageMessage from "../../../model/SageMessage";

export function findPc(sageMessage: SageMessage, pcNameOrIndex: Optional<string>): GameCharacter | undefined {
	if (sageMessage.game) {
		return sageMessage.playerCharacter;
	}
	if (!sageMessage.channel || sageMessage.channel.dialog) {
		if (isBlank(pcNameOrIndex)) {
			return sageMessage.sageUser.playerCharacters.first();
		}
		return sageMessage.sageUser.playerCharacters.findByNameOrIndex(pcNameOrIndex);
	}
	return undefined;
}