import type SageMessage from "../../../model/SageMessage";
import { updateSheet } from "../../pathbuilder";
import { getCharacterForStats } from "./getCharacterForStats";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { getUserDid } from "./getUserDid";
import { promptCharConfirm } from "./promptCharConfirm";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

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

	await character.updateStats(sageMessage.args.keyValuePairs(), false);
	return promptCharConfirm(sageMessage, character, `Update ${character.name}?`, async char => {
		const charSaved = await char.save(true);
		if (charSaved) {
			const { game } = sageMessage;
			if (game) {
				if (characterTypeMeta.isGm) {
					game.updateGmCharacterName(char.name);
					return game.save();
				}else {
					await game.encounters.updatePins();
					await game.parties.updatePins();
					if (char.pathbuilder?.messageId) {
						await updateSheet(sageMessage.caches, char.pathbuilder);
					}
				}
			}
		}
		return charSaved;
	});
}