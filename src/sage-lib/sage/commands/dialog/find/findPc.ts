import { isBlank } from "@rsc-utils/string-utils";
import { Optional } from "@rsc-utils/type-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";

export function findPc(sageCommand: SageCommand, pcNameOrIndex: Optional<string>): GameCharacter | undefined {
	if (sageCommand.game) {
		return sageCommand.playerCharacter;
	}
	if (sageCommand.allowDialog) {
		if (isBlank(pcNameOrIndex)) {
			return sageCommand.sageUser.playerCharacters.first();
		}
		return sageCommand.sageUser.playerCharacters.findByNameOrIndex(pcNameOrIndex);
	}
	return undefined;
}