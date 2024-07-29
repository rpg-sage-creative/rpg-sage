import type { SageCommand } from "../../../model/SageCommand.js";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta.js";

export function testCanAdminCharacter(sageCommand: SageCommand, characterTypeMeta: TCharacterTypeMeta): boolean {
	if (!sageCommand.allowCommand) {
		return false;
	}

	if (sageCommand.game) {
		return characterTypeMeta.isPcOrCompanion
			? sageCommand.isGameMaster || sageCommand.isPlayer
			: sageCommand.isGameMaster;
	}

	return characterTypeMeta.isPcOrCompanion;
	/** @todo: When we have NPCs outside of games ... return true; */
}