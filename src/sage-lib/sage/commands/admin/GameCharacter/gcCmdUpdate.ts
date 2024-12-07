import { isUnsafeName } from "@rsc-utils/discord-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterArgs } from "./getCharacterArgs.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { promptCharConfirm, promptModsConfirm } from "./promptCharConfirm.js";
import { sendGameCharacter } from "./sendGameCharacter.js";
import { sendNotFound } from "./sendNotFound.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdUpdate(sageMessage: SageMessage, character?: GameCharacter): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage, character);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		if (characterTypeMeta.isGmOrNpcOrMinion && !sageMessage.game) {
			return sageMessage.replyStack.whisper(`Sorry, NPCs only exist inside a Game.`);
		}
		return sageMessage.replyStack.whisper(`Sorry, you cannot update characters here.`);
	}

	const { core, mods, names, stats, userId } = getCharacterArgs(sageMessage, characterTypeMeta.isGm, true);

	if (!core && !mods?.length && !stats?.length) {
		// instead of simply failing, treat this as a details command.
		if (!character) {
			const userId = getUserDid(sageMessage);
			const names = sageMessage.args.getNames();
			const alias = sageMessage.args.getString("alias") ?? undefined;

			character = await getCharacter(sageMessage, characterTypeMeta, userId, names, alias);

			if (!character) {
				await sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor} Details`, characterTypeMeta.singularDescriptor!, names.name);
				return;
			}
		}

		await sendGameCharacter(sageMessage, character);
		return;
	}

	if (!character) {
		character = characterTypeMeta.isGm
			? sageMessage.gmCharacter
			: await getCharacter(sageMessage, characterTypeMeta, userId, names, core?.alias);
	}

	if (character) {
		if (core) {
			await character.update(core, false);
			if (isUnsafeName(core.name)) {
				return sageMessage.replyStack.whisper(`Due to Discord policy, you cannot have a username with "discord" in the name!`);
			}
		}

		await character.processStatsAndMods(stats, mods);

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

		let updated = false;
		await promptCharConfirm(sageMessage, character, `Update ${character.name}?`, async char => {
			updated = await char.save();
			if (characterTypeMeta.isGm) {
				const core = sageMessage.game?.toJSON();
				if (core) core.gmCharacterName = char.name;
			}
			return updated;
		});

		const not = updated ? "" : "***NOT***";
		await sageMessage.replyStack.reply(`Character "${character.name}" ${not} Updated!`);
		return;
	}

	if (!names.name && !names.oldName && !core?.alias) {
		return sageMessage.replyStack.whisper(`Sorry, you must provide a name or alias to update a character.`);
	}

	return sageMessage.replyStack.whisper(`Sorry, "${names.name ?? names.oldName}" not found, please use create command!`);
}