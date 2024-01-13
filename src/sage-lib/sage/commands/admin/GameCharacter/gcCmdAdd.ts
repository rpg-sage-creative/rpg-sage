import type { Optional } from "@rsc-utils/type-utils";
import type CharacterManager from "../../../model/CharacterManager";
import GameCharacter from "../../../model/GameCharacter";
import type SageMessage from "../../../model/SageMessage";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { getUserDid } from "./getUserDid";
import { promptCharConfirm } from "./promptCharConfirm";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

function urlToName(url: Optional<string>): string | undefined {
	return url?.split("/").pop()?.split(".").shift();
}

export async function gcCmdAdd(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		names = sageMessage.args.removeAndReturnNames(),
		core = sageMessage.args.removeAndReturnCharacterOptions(names, userDid!);

	if (!core.name) {
		core.name = urlToName(core.tokenUrl) ?? urlToName(core.avatarUrl)!;
	}

	if (!core.name) {
		return sageMessage.reactFailure("Cannot create a character without a name!");
	}

	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.sageUser;

	let characterManager: CharacterManager | undefined = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		const character = characterManager?.findByUserAndName(userDid, names.charName) ?? characterManager.findByUser(userDid!);
		core.userDid = character?.userDid;
		characterManager = character?.companions;
	}
	if (characterTypeMeta.isMinion) {
		const character = characterManager?.findByName(names.charName);
		characterManager = character?.companions;
	}
	if (!characterManager) {
		return sageMessage.reactFailure(`Unable to find character "${names.charName}".`);
	}

	const newChar = new GameCharacter(core, characterManager);
	return promptCharConfirm(sageMessage, newChar, `Create ${newChar.name}?`, async char => {
		if (sageMessage.game && userDid) {
			// why? debug("Checking owner's status as player/gm ...");
			if (characterTypeMeta.isNpc) {
				if (!sageMessage.game.hasGameMaster(userDid)) {
					const gameMasterAdded = await sageMessage.game.addGameMasters([userDid]);
					if (!gameMasterAdded) {
						await sageMessage.reactFailure();
						return false;
					}
				}
			} else {
				if (!sageMessage.game.hasPlayer(userDid)) {
					const playerAdded = await sageMessage.game.addPlayers([userDid]);
					if (!playerAdded) {
						await sageMessage.reactFailure();
						return false;
					}
				}
			}
		}
		const gc = await characterManager!.addCharacter(char.toJSON());
		// debug(gc, gc?.toJSON())
		return Promise.resolve(!!gc);
	});
}