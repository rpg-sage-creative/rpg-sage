import type { SageCommand } from "../../../model/SageCommand.js";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta.js";

export function testCanAdminCharacter(sageCommand: SageCommand, characterTypeMeta: TCharacterTypeMeta): boolean {
	if (!sageCommand.allowCommand) {
		return false;
	}

	if (sageCommand.game) {
		if (sageCommand.canManageServer) return true;
		return characterTypeMeta.isPcOrCompanion
			? !!sageCommand.actor.isGameUser
			: !!sageCommand.actor.isGameMaster;
	}

	return characterTypeMeta.isPcOrCompanion;
	/** @todo: When we have NPCs outside of games ... return true; */
}