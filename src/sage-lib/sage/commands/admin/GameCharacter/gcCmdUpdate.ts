import { GameCharacter } from "../../../model/GameCharacter";
import type { SageMessage } from "../../../model/SageMessage";
import { getCharacter } from "./getCharacter";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { getUserDid } from "./getUserDid";
import { promptCharConfirm } from "./promptCharConfirm";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

export async function gcCmdUpdate(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const names = sageMessage.args.removeAndReturnNames();
	if (characterTypeMeta.isGm) {
		if (names.newName) {
			names.oldName = sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
		}
		if (names.count === 0) {
			names.name = sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
		}
	}

	const userDid = await getUserDid(sageMessage),
		newUserDid = await sageMessage.args.removeAndReturnUserDid("newuser") ?? await sageMessage.args.removeAndReturnUserDid("user"),
		core = sageMessage.args.removeAndReturnCharacterOptions(names, newUserDid ?? userDid!),
		character = await getCharacter(sageMessage, characterTypeMeta, userDid!, names);
	if (character) {
		await character.update(core, false);
		return promptCharConfirm(sageMessage, character, `Update ${character.name}?`, async char => {
			const charSaved = await char.save();
			if (charSaved && characterTypeMeta.isGm) {
				sageMessage.game!.updateGmCharacterName(char.name);
				return sageMessage.game!.save();
			}
			return charSaved;
		});
	}
	return sageMessage.reactFailure();
}