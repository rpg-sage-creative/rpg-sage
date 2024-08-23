import type { SageMessage } from "../../../model/SageMessage.js";
import type { TKeyValuePair } from "../../../model/SageMessageArgs.js";
import { updateSheet } from "../../pathbuilder.js";
import { getCharacterForStats } from "./getCharacterForStats.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdStats(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.denyByPerm("Set Character Stats", "You aren't allowed to alter a character here.");
	}

	const userDid = await getUserDid(sageMessage),
		names = sageMessage.args.removeAndReturnNames(),
		character = await getCharacterForStats(sageMessage, characterTypeMeta, userDid!, names);

	if (!character) {
		await sageMessage.reactFailure(`${characterTypeMeta.singularDescriptor ?? "Character"} "${names.name}" not found.`);
		return;
	}

	await character.updateStats(sageMessage.args.keyValuePairs() as TKeyValuePair[], false);
	return promptCharConfirm(sageMessage, character, `Update ${character.name}?`, async char => {
		const charSaved = await char.save(true);
		if (charSaved) {
			const { game } = sageMessage;
			if (game) {
				if (characterTypeMeta.isGm) {
					return game.update({ gmCharacterName:char.name });
				}else {
					await game.encounters.updatePins();
					await game.parties.updatePins();
					if (char.pathbuilder?.hasSheetRef) {
						await updateSheet(sageMessage, char.pathbuilder);
					}
				}
			}
		}
		return charSaved;
	});
}