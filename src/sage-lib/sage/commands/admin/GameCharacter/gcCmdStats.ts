import type SageMessage from "../../../model/SageMessage";
import { getCharacterForStats } from "./getCharacterForStats";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { getUserDid } from "./getUserDid";
import { promptCharConfirm } from "./promptCharConfirm";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

export async function gcCmdStats(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		names = sageMessage.args.removeAndReturnNames(),
		character = await getCharacterForStats(sageMessage, characterTypeMeta, userDid!, names);

	if (character) {
		character.updateStats(sageMessage.args.keyValuePairs(), false);
		return promptCharConfirm(sageMessage, character, `Update ${character.name}?`, async char => {
			const charSaved = await char.save(true);
			if (charSaved) {
				const { game } = sageMessage;
				if (game) {
					game.encounters.updatePins();
					game.parties.updatePins();
					if (characterTypeMeta.isGm) {
						game.updateGmCharacterName(char.name);
						return game.save();
					}
				}

			}
			return charSaved;
		});
	}
	return sageMessage.reactFailure();
}