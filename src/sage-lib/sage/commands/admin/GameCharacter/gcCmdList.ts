import type { Optional } from "@rsc-utils/core-utils";
import { CharacterManager } from "../../../model/CharacterManager.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { sendGameCharactersOrNotFound } from "./sendGameCharactersOrNotFound.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdList(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		if (characterTypeMeta.isGmOrNpcOrMinion && !sageMessage.game) {
			return sageMessage.replyStack.whisper(`Sorry, NPCs only exist inside a Game.`);
		}
		return sageMessage.replyStack.whisper(`Sorry, you cannot list characters here.`);
	}

	const hasCharacters = sageMessage.game ?? sageMessage.sageUser;

	let characterManager: Optional<CharacterManager> = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		const userDid = await getUserDid(sageMessage),
			names = sageMessage.args.getNames(),
			characterName = names.charName ?? names.name ?? sageMessage.playerCharacter?.name,
			character = characterManager.findByUser(userDid, characterName);
		characterManager = character?.companions;

	}else if (characterTypeMeta.isMinion) {
		const names = sageMessage.args.getNames(),
			characterName = names.charName ?? names.name,
			character = characterManager.findByName(characterName);

		// we are looking for minions from this npc
		if (character) {
			characterManager = character?.companions;

		// let's grab all the minions
		}else {
			const minionManager = new CharacterManager();
			minionManager.characterType = "minion";
			characterManager.forEach(char => char.companions.forEach(comp => minionManager.push(comp)));
			characterManager = minionManager;
		}
	}

	await sendGameCharactersOrNotFound(sageMessage, characterManager, characterTypeMeta.pluralDescriptor);
}