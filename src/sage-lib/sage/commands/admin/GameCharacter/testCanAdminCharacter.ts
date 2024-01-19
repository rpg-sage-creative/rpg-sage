import type { SageMessage } from "../../../model/SageMessage";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta";

export function testCanAdminCharacter(sageMessage: SageMessage, characterTypeMeta: TCharacterTypeMeta): boolean {
	if (!sageMessage.allowAdmin) {
		return false;
	}

	if (sageMessage.game) {
		return characterTypeMeta.isPcOrCompanion
			? sageMessage.isGameMaster || sageMessage.isPlayer
			: sageMessage.isGameMaster;
	}

	return characterTypeMeta.isPcOrCompanion;
	// TODO: When we have NPCs outside of games ... return true;
}