import type { SageMessage } from "../../../model/SageMessage.js";
import { cannotManageCharacter } from "./cannotManageCharacter.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { promptCharConfirm } from "./promptCharConfirm.js";

export async function gcCmdDelete(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);

	// initial check of permission to manage characters
	if (await cannotManageCharacter(sageMessage, characterTypeMeta, "DELETE")) {
		return;
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

	const localize = sageMessage.getLocalizer();

	if (!character) {
		return sageMessage.replyStack.whisper(localize("CHARACTER_S_NOT_FOUND", names.name ?? "*no name given*"));
	}

	// revalidate access to manage the character
	if (await cannotManageCharacter(sageMessage, characterTypeMeta, "DELETE", character)) {
		return;
	}

	let deleted = false;
	const promptMessage = localize("DELETE_S_?", character.name);
	await promptCharConfirm(sageMessage, character, promptMessage, async char => deleted = await char.remove());

	const messageKey = deleted ? "CHARACTER_S_DELETED" : "CHARACTER_S_NOT_DELETED";
	const message = localize(messageKey, character.name);
	await sageMessage.replyStack.reply(message);
}