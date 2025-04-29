import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { sendNotFound } from "./sendNotFound.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdDelete(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		hasCharacters = sageMessage.game ?? sageMessage.sageUser,
		characterManager = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
		names = sageMessage.args.removeAndReturnNames(true);

	const character =
		characterTypeMeta.isCompanion ? characterManager.findCompanion(userDid, names.charName!, names.name!)
		: characterTypeMeta.isMinion ? characterManager.findCompanionByName(names.name)
		: characterManager.findByUserAndName(userDid, names.name!);

	if (character) {
		return promptCharConfirm(sageMessage, character, `Delete ${character.name}?`, char => char.remove());
	}
	return sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-delete`, characterTypeMeta.singularDescriptor!, names.name);
}