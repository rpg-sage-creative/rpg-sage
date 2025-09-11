import type { SageCommand } from "../../../model/SageCommand.js";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta.js";

export function testCanAdminCharacter(sageCommand: SageCommand, characterTypeMeta: TCharacterTypeMeta): boolean {
	if (!sageCommand.allowCommand) {
		return false;
	}

	const { actor } = sageCommand;

	if (sageCommand.game) {
		if (actor.canManageGames) return true;
		return characterTypeMeta.isPcOrCompanion
			? !!actor.isGameUser
			: !!actor.isGameMaster;
	}

	if (characterTypeMeta.isGm || (characterTypeMeta.isMinion && sageCommand.args.getNames().charName === "gm")) {
		return !!actor.canManageGames;
	}

	return characterTypeMeta.isPcOrCompanion;
	/** @todo: When we have NPCs outside of games ... return true; */
}