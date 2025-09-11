import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdDelete(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = getUserDid(sageMessage),
		hasCharacters = sageMessage.game ?? sageMessage.sageUser,
		characterManager = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters,
		names = sageMessage.args.getNames();

	let character =
		characterTypeMeta.isCompanion ? characterManager.findCompanion(userDid, names.charName!, names.name!)
		: characterTypeMeta.isMinion ? characterManager.findCompanion(names.name)
		: characterManager.findByUser(userDid, names.name!);

	if (!character && characterTypeMeta.isMinion && names.charName?.toLowerCase() === "gm") {
		character = (sageMessage.game ?? sageMessage.server)?.gmCharacter.companions.findByName(names.name);
	}

	if (!character) {
		return sageMessage.replyStack.whisper(`Sorry, ${characterTypeMeta.singularDescriptor} "${names.name ?? "*no name given*"}" not found.`);
	}

	let deleted = false;
	await promptCharConfirm(sageMessage, character, `Delete ${characterTypeMeta.singularDescriptor} "${character.name}"?`, async char => deleted = await char.remove());

	const not = deleted ? "" : "***NOT***";
	await sageMessage.replyStack.reply(`${characterTypeMeta.singularDescriptor} "${character.name}" ${not} Deleted!`);
}