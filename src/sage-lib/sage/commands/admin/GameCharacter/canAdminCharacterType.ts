import type { Snowflake } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../../../model/GameCharacter";
import type { SageCommand } from "../../../model/SageCommand";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta";

type Options = { characterTypeMeta: TCharacterTypeMeta; } | { character: GameCharacter; };

/**
 * Checks the actor's access to the character or type.
 * If they are denied, a message is sent via replyStack.whisper().
 */
export async function canAdminCharacter(sageCommand: SageCommand, options: Options): Promise<boolean> {
	let isGmOrNpcOrMinion: boolean;
	let isPcOrCompanion: boolean;
	let userId: Snowflake | undefined;
	if ("character" in options) {
		isGmOrNpcOrMinion = ["gm", "npc", "minion"].includes(options.character.type);
		isPcOrCompanion = ["pc", "companion"].includes(options.character.type);
		userId = options.character.userDid;
	}else {
		isGmOrNpcOrMinion = options.characterTypeMeta.isGmOrNpcOrMinion;
		isPcOrCompanion = options.characterTypeMeta.isPcOrCompanion;
	}

	if (!sageCommand.allowCommand) {
		await sageCommand.replyStack.whisper(`Sorry, you cannot manage characters here.`);
		return false;
	}
	if (sageCommand.game) {
		if (!sageCommand.canAdminGame && !sageCommand.isPlayer) {
			await sageCommand.replyStack.whisper(`Sorry, you are not part of this Game.`);
			return false;
		}
		if (isGmOrNpcOrMinion && !sageCommand.canAdminGame) {
			await sageCommand.replyStack.whisper(`Sorry, only GMs and Admins can manage NPCs.`);
			return false;
		}
	}else if (isGmOrNpcOrMinion) {
		await sageCommand.replyStack.whisper(`Sorry, NPCs only exist inside a Game.`);
		return false;
	}
	if (isPcOrCompanion && userId && !sageCommand.canAdminGame && !sageCommand.sageUser.equals(userId)) {
		await sageCommand.replyStack.whisper(`Sorry, you can't touch another Player's Character.`);
		return false;
	}
	return true;
}