import type { Optional } from "@rsc-utils/core-utils";
import type { CharacterManager } from "../../../model/CharacterManager";
import type { SageMessage } from "../../../model/SageMessage";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { getUserDid } from "./getUserDid";
import { sendGameCharactersOrNotFound } from "./sendGameCharactersOrNotFound";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

export async function gcCmdList(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.sageUser;

	let characterManager: Optional<CharacterManager> = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		const userDid = await getUserDid(sageMessage),
			names = sageMessage.args.removeAndReturnNames(true),
			characterName = names.charName ?? names.name ?? sageMessage.playerCharacter?.name,
			character = characterManager.findByUserAndName(userDid, characterName);
		characterManager = character?.companions;
	}else if (characterTypeMeta.isMinion) {
		const names = sageMessage.args.removeAndReturnNames(true),
			characterName = names.charName ?? names.name,
			character = characterManager.findByName(characterName);
		characterManager = character?.companions;
	}

	return sendGameCharactersOrNotFound(sageMessage, characterManager, `${characterTypeMeta.commandDescriptor}-list`, characterTypeMeta.pluralDescriptor!);
}