import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterArgs } from "./getCharacterArgs.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdUpdate(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		if (characterTypeMeta.isGmOrNpcOrMinion && !sageMessage.game) {
			return sageMessage.replyStack.whisper(`Sorry, NPCs only exist inside a Game.`);
		}
		return sageMessage.replyStack.whisper(`Sorry, you cannot update characters here.`);
	}

	const { core, mods, names, stats, userId } = getCharacterArgs(sageMessage, characterTypeMeta.isGm);

	if (!core && !mods?.length && !stats?.length) {
		return sageMessage.replyStack.whisper("Nothing to do.");
	}

	const character = characterTypeMeta.isGm
		? sageMessage.gmCharacter
		: await getCharacter(sageMessage, characterTypeMeta, userId, names, core?.alias);
	if (character) {
		if (core) {
			await character.update(core, false);
			if (/discord/i.test(core.name)) {
				return sageMessage.replyStack.whisper(`Due to Discord policy, you cannot have a username with "discord" in the name!`);
			}
		}
		if (stats?.length) {
			await character.updateStats(stats, false);
		}
		if (mods?.length) {
			await character.modStats(mods, false);
		}

		return promptCharConfirm(sageMessage, character, `Update ${character.name}?`, async char => {
			const charSaved = await char.save();
			if (charSaved && characterTypeMeta.isGm) {
				return sageMessage.game!.update({ gmCharacterName:char.name });
			}
			return charSaved;
		});
	}
	return sageMessage.replyStack.whisper(`Sorry, "${names.name ?? names.oldName}" not found, please use create command!`);
}