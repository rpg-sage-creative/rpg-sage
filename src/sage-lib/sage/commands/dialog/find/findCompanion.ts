import { isBlank } from "@rsc-utils/string-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";

export function findCompanion(sageMessage: SageMessage, companionNameOrIndex: Optional<string>): GameCharacter | undefined {
	const grabFirst = isBlank(companionNameOrIndex);
	if (sageMessage.gameChannel) {
		const companions = sageMessage.playerCharacter?.companions;
		if (companions) {
			return grabFirst ? companions.first() : companions.findByNameOrIndex(companionNameOrIndex);
		}
	} else if (sageMessage.allowDialog) {
		// Currently only allow a single PC per server outside of games
		const playerCharacters = sageMessage.sageUser.playerCharacters;
		for (const playerCharacter of playerCharacters) {
			const companions = playerCharacter.companions;
			const companion = grabFirst ? companions.first() : companions.findByNameOrIndex(companionNameOrIndex);
			if (companion) return companion;
		}
	}
	return undefined;
}