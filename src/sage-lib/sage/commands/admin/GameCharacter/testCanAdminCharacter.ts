import type { SageCommand } from "../../../model/SageCommand.js";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta.js";

export function testCanAdminCharacter(sageCommand: SageCommand, characterTypeMeta: TCharacterTypeMeta): boolean {
	if (!sageCommand.allowCommand) {
		return false;
	}

	if (sageCommand.game) {
		if (sageCommand.canAdminGames) return true;
		return characterTypeMeta.isPcOrCompanion
			? sageCommand.isGameMaster || sageCommand.isPlayer
			: sageCommand.isGameMaster;
	}

	if (characterTypeMeta.isGm || (characterTypeMeta.isMinion && sageCommand.args.getNames().charName === "gm")) {
		return sageCommand.canAdminGames;
	}

	return characterTypeMeta.isPcOrCompanion;
	/** @todo: When we have NPCs outside of games ... return true; */
}