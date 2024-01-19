import { GameCharacter } from "../../../model/GameCharacter";
import type { SageMessage } from "../../../model/SageMessage";
import type { TNames } from "../../../model/SageMessageArgsManager";
import { findCompanion } from "./findCompanion";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { getUserDid } from "./getUserDid";
import { sendGameCharacter } from "./sendGameCharacter";
import { sendNotFound } from "./sendNotFound";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

export async function gcCmdDetails(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.sageUser,
		characterManager = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
		names = characterTypeMeta.isGm ? <TNames>{ name: sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName } : sageMessage.args.removeAndReturnNames(true);

	const character =
		characterTypeMeta.isCompanion ? findCompanion(characterManager, userDid, names)
		: characterTypeMeta.isMinion ? characterManager.findCompanionByName(names.name)
		: characterManager.findByUserAndName(userDid, names.name) ?? characterManager.filterByUser(userDid!)[0];

	return character
		? <any>sendGameCharacter(sageMessage, character)
		: sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-details`, characterTypeMeta.singularDescriptor!, names.name);
}
