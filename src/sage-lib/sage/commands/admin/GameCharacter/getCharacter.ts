import type { Snowflake } from "@rsc-utils/core-utils";
import type { CharacterManager } from "../../../model/CharacterManager.js";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { Names } from "../../../model/SageCommandArgs.js";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta.js";

/** Reusable code to get GameCharacter for the commands. */
export async function getCharacter(sageCommand: SageCommand, characterTypeMeta: TCharacterTypeMeta, userDid: Snowflake, names: Names, alias?: string): Promise<GameCharacter | undefined> {
	const hasCharacters = sageCommand.game && !characterTypeMeta.isMy ? sageCommand.game : sageCommand.sageUser;
	let characterManager: CharacterManager | undefined = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		characterManager = characterManager?.findByUserAndName(userDid, names.charName)?.companions;
	}else if (characterTypeMeta.isMinion) {
		characterManager = characterManager?.findByName(names.charName)?.companions;
	}
	let name = names.oldName ?? names.name;
	if (!name && characterTypeMeta.isGm) {
		name = sageCommand.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
	}
	return characterManager?.findByName(name)
		?? characterManager?.findByName(alias);
}

// async function getCharacter(sageCommand: sageCommand): Promise<GameCharacter> {
// 	const characterTypeMeta = getCharacterTypeMeta(sageCommand),
// 		userDid = await getUserDid(sageCommand),
// 		hasCharacters = sageCommand.game && !characterTypeMeta.isMy ? sageCommand.game : sageCommand.sageUser,
// 		characterManager = characterTypeMeta.isNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
// 		names = sageCommand.args.removeAndReturnNames("charName", "name");

// 	return characterTypeMeta.isCompanionOrMinion
// 		? characterManager.findCompanion(userDid, names.charName, names.name)
// 		: characterManager.findByUserAndName(userDid, names.name);
// }