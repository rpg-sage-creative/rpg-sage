import { GameSystemType } from "@rsc-sage/types";
import { Condition } from "../../../../../gameSystems/p20/lib/Condition.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { TKeyValuePair } from "../../../model/SageMessageArgs.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterArgs } from "./getCharacterArgs.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { promptCharConfirm, promptModsConfirm } from "./promptCharConfirm.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

function checkStatBoundsP20(pair: TKeyValuePair): string | undefined {
	// conditions have a min value of 0
	const valuedConditions = Condition.getValuedConditions();
	if (valuedConditions.includes(pair.key.toLowerCase())) {
		if (!pair.value) return "";
		if (+pair.value <= 0) return "";
	}
	return undefined;
}

export async function gcCmdUpdate(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		if (characterTypeMeta.isGmOrNpcOrMinion && !sageMessage.game) {
			return sageMessage.replyStack.whisper(`Sorry, NPCs only exist inside a Game.`);
		}
		return sageMessage.replyStack.whisper(`Sorry, you cannot update characters here.`);
	}

	const { core, mods, names, stats, userId } = getCharacterArgs(sageMessage, characterTypeMeta.isGm, true);

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
			const gameSystem = character.gameSystem ?? sageMessage.game?.gameSystem ?? sageMessage.server.gameSystem;
			const boundsChecker = gameSystem?.type === GameSystemType.PF2e || gameSystem?.type === GameSystemType.SF2e ? checkStatBoundsP20 : undefined;
			await character.modStats(mods, false, boundsChecker);
		}

		if (!core && (stats?.length || mods?.length)) {
			const statModKeys = (stats?.map(pair => pair.key) ?? []).concat(mods?.map(pair => pair.key) ?? []);
			return promptModsConfirm(sageMessage, character, statModKeys, async char => {
				const charSaved = await char.save();
				if (charSaved && characterTypeMeta.isGm) {
					return sageMessage.game!.update({ gmCharacterName:char.name });
				}
				return charSaved;
			});
		}

		return promptCharConfirm(sageMessage, character, `Update ${character.name}?`, async char => {
			const charSaved = await char.save();
			if (charSaved && characterTypeMeta.isGm) {
				return sageMessage.game!.update({ gmCharacterName:char.name });
			}
			return charSaved;
		});
	}

	if (!names.name && !names.oldName && !core?.alias) {
		return sageMessage.replyStack.whisper(`Sorry, you must provide a name or alias to update a character.`);
	}

	return sageMessage.replyStack.whisper(`Sorry, "${names.name ?? names.oldName}" not found, please use create command!`);
}