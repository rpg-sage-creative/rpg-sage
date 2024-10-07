import type { SageMessage } from "../../../model/SageMessage.js";
import { findCompanion } from "./findCompanion.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { sendGameCharacter } from "./sendGameCharacter.js";
import { sendNotFound } from "./sendNotFound.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdDetails(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		hasCharacters = sageMessage.game ?? sageMessage.sageUser,
		characterManager = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
		names = sageMessage.args.removeAndReturnNames(true);

	const character =
		characterTypeMeta.isGm ? sageMessage.gmCharacter
		: characterTypeMeta.isCompanion ? findCompanion(characterManager, userDid, names)
		: characterTypeMeta.isMinion ? characterManager.findCompanionByName(names.name)
		: characterManager.findByUserAndName(userDid, names.name) ?? characterManager.filterByUser(userDid!)[0];

	return character
		? <any>sendGameCharacter(sageMessage, character)
		: sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-details`, characterTypeMeta.singularDescriptor!, names.name);
}
