import type SageMessage from "../../../model/SageMessage";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { getUserDid } from "./getUserDid";
import { promptCharConfirm } from "./promptCharConfirm";
import { sendNotFound } from "./sendNotFound";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

export async function gcCmdDelete(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.sageUser,
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