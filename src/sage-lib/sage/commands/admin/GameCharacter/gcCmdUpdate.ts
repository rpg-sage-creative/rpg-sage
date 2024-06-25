import type { Snowflake } from "@rsc-utils/core-utils";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

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

	const userDid = await getUserDid(sageMessage);
	const newUserDid = await sageMessage.args.removeAndReturnUserDid("newuser") ?? await sageMessage.args.removeAndReturnUserDid("user");
	const core = sageMessage.args.getCharacterOptions(names, (newUserDid ?? userDid) as Snowflake);
	const character = await getCharacter(sageMessage, characterTypeMeta, userDid!, names, core.alias);
	if (character) {
		await character.update(core, false);
		return promptCharConfirm(sageMessage, character, `Update ${character.name}?`, async char => {
			const charSaved = await char.save();
			if (charSaved && characterTypeMeta.isGm) {
				return sageMessage.game!.update({ gmCharacterName:char.name });
			}
			return charSaved;
		});
	}
	return sageMessage.reactFailure();
}