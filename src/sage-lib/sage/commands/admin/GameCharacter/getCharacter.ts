import type { Snowflake } from "discord.js";
import type CharacterManager from "../../../model/CharacterManager";
import GameCharacter from "../../../model/GameCharacter";
import type SageMessage from "../../../model/SageMessage";
import type { TNames } from "../../../model/SageMessageArgsManager";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta";

/** Reusable code to get GameCharacter for the commands. */
export async function getCharacter(sageMessage: SageMessage, characterTypeMeta: TCharacterTypeMeta, userDid: Snowflake, names: TNames): Promise<GameCharacter | undefined> {
	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.sageUser;
	let characterManager: CharacterManager | undefined = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		characterManager = characterManager?.findByUserAndName(userDid, names.charName)?.companions;
	}else if (characterTypeMeta.isMinion) {
		characterManager = characterManager?.findByName(names.charName)?.companions;
	}
	let name = names.oldName ?? names.name;
	if (!name && characterTypeMeta.isGm) {
		name = sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
	}
	return characterManager?.findByName(name);
}

// async function getCharacter(sageMessage: SageMessage): Promise<GameCharacter> {
// 	const characterTypeMeta = getCharacterTypeMeta(sageMessage),
// 		userDid = await getUserDid(sageMessage),
// 		hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.sageUser,
// 		characterManager = characterTypeMeta.isNpc ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
// 		names = sageMessage.args.removeAndReturnNames("charName", "name");

// 	return characterTypeMeta.isCompanionOrMinion
// 		? characterManager.findCompanion(userDid, names.charName, names.name)
// 		: characterManager.findByUserAndName(userDid, names.name);
// }