import type { Optional } from "@rsc-utils/core-utils";
import type { CharacterManager } from "../../../model/CharacterManager.js";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

function urlToName(url: Optional<string>): string | undefined {
	return url?.split("/").pop()?.split(".").shift();
}

export async function gcCmdCreate(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const userDid = await getUserDid(sageMessage),
		names = sageMessage.args.removeAndReturnNames(),
		core = sageMessage.args.getCharacterOptions(names, userDid!);

	if (!core.name) {
		core.name = urlToName(core.tokenUrl) ?? urlToName(core.avatarUrl)!;
	}

	if (/discord/i.test(core.name)) {
		return sageMessage.reactFailure(`Due to Discord policy, you cannot have a username with "discord" in the name!`);
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
	return promptCharConfirm(sageMessage, newChar, `Create ${characterTypeMeta.singularDescriptor} ${newChar.name}?`, async char => {
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