import { SageMessage } from "../../../model/SageMessage";
import { TCharacterTypeMeta } from "./getCharacterTypeMeta";

export function testCanAdminCharacter(sageMessage: SageMessage, characterTypeMeta: TCharacterTypeMeta): boolean {
	if (sageMessage.game) {
		return characterTypeMeta.isPcOrCompanion
			? sageMessage.isGameMaster || sageMessage.isPlayer
			: sageMessage.isGameMaster;
	}

	return characterTypeMeta.isPcOrCompanion;
	/** @todo When we have NPCs outside of games ... return true; */
}
