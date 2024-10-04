import type { CharacterManager } from "../../../model/CharacterManager.js";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacterArgs } from "./getCharacterArgs.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";


export async function gcCmdCreate(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		if (characterTypeMeta.isGmOrNpcOrMinion && !sageMessage.game) {
			return sageMessage.replyStack.whisper(`Sorry, NPCs only exist inside a Game.`);
		}
		return sageMessage.replyStack.whisper(`Sorry, you cannot create characters here.`);
	}

	const { core, mods, names, stats, userId } = getCharacterArgs(sageMessage, characterTypeMeta.isGm, false);

	if (!core?.name) {
		return sageMessage.replyStack.whisper("Cannot create a character without a name!");
	}

	if (/discord/i.test(core.name)) {
		return sageMessage.replyStack.whisper(`Due to Discord policy, you cannot have a username with "discord" in the name!`);
	}

	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.sageUser;

	let characterManager: CharacterManager | undefined = characterTypeMeta.isGmOrNpcOrMinion ? hasCharacters.nonPlayerCharacters : hasCharacters.playerCharacters;
	if (characterTypeMeta.isCompanion) {
		const character = characterManager?.findByUser(userId, names.charName) ?? characterManager.findByUser(userId);
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
	const existing = characterManager.findByName(core.name);
	if (existing) {
		return sageMessage.replyStack.whisper(`"${core.name}" already exists, please use update command!`);
	}

	const newChar = new GameCharacter(core, characterManager);
	await newChar.processStatsAndMods({ stats, mods }, sageMessage.game?.gameSystem ?? sageMessage.server.gameSystem);

	return promptCharConfirm(sageMessage, newChar, `Create ${characterTypeMeta.singularDescriptor} ${newChar.name}?`, async char => {
		if (sageMessage.game && userId) {
			// why? debug("Checking owner's status as player/gm ...");
			if (characterTypeMeta.isNpc) {
				if (!sageMessage.game.hasGameMaster(userId)) {
					const gameMasterAdded = await sageMessage.game.addGameMasters([userId]);
					if (!gameMasterAdded) {
						await sageMessage.reactFailure();
						return false;
					}
				}
			} else {
				if (!sageMessage.game.hasPlayer(userId)) {
					const playerAdded = await sageMessage.game.addPlayers([userId]);
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