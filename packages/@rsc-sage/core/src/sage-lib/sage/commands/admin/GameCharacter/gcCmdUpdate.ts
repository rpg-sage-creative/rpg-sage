import { isInvalidWebhookUsername } from "@rsc-utils/discord-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { cannotManageCharacter } from "./cannotManageCharacter.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterArgs } from "./getCharacterArgs.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { getUserDid } from "./getUserDid.js";
import { promptCharConfirm, promptModsConfirm } from "./promptCharConfirm.js";
import { sendGameCharacter } from "./sendGameCharacter.js";
import { sendNotFound } from "./sendNotFound.js";

export async function gcCmdUpdate(sageMessage: SageMessage, character?: GameCharacter): Promise<void> {
	const localize = sageMessage.getLocalizer();

	const characterTypeMeta = getCharacterTypeMeta(sageMessage, character);

	// initial check of permission to manage characters
	if (await cannotManageCharacter(sageMessage, characterTypeMeta, "UPDATE")) {
		return;
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
				await sendNotFound(sageMessage, `${characterTypeMeta.singularDescriptor} Details`, characterTypeMeta.singularDescriptor!, names.name);
				return;
			}
		}

		// revalidate access to view the character
		if (await cannotManageCharacter(sageMessage, characterTypeMeta, "DETAILS", character)) {
			return;
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
		// revalidate access to manage the character
		if (await cannotManageCharacter(sageMessage, characterTypeMeta, "UPDATE", character)) {
			return;
		}

		if (core) {
			await character.update(core, false);

			// we only need to check the name if we are changing it.
			if (core.name) {
				const invalidName = isInvalidWebhookUsername(core.name);
				if (invalidName) {
					const content = invalidName === true
						? localize("USERNAME_TOO_LONG")
						: localize("USERNAME_S_BANNED", invalidName)
					return sageMessage.replyStack.whisper(content);
				}
			}
		}

		const updatedKeys = await character.processStatsAndMods(stats, mods);

		if (!core && updatedKeys.size) {
			return promptModsConfirm(sageMessage, character, updatedKeys, async char => {
				if (characterTypeMeta.isGm) {
					const owner = sageMessage.game ?? sageMessage.server;
					if (owner && owner.toJSON().gmCharacterName !== char.name) {
						owner.toJSON().gmCharacterName = char.name;
					}
				}
				return char.save(true);
			});
		}

		let updated = false;
		await promptCharConfirm(sageMessage, character, localize("UPDATE_S_?", character.name), async char => {
			if (characterTypeMeta.isGm) {
				const owner = sageMessage.game ?? sageMessage.server;
				if (owner && owner.toJSON().gmCharacterName !== char.name) {
					owner.toJSON().gmCharacterName = char.name;
				}
			}
			return updated = await char.save(true);
		});

		const messageKey = updated ? "CHARACTER_S_UPDATED" : "CHARACTER_S_NOT_UPDATED";
		const message = localize(messageKey, character.name);
		await sageMessage.replyStack.reply(message);
		return;
	}

	if (!names.name && !names.oldName && !core?.alias) {
		return sageMessage.replyStack.whisper(localize("MUST_PROVIDE_NAME_OR_ALIAS_TO_UPDATE"));
	}

	return sageMessage.replyStack.whisper(localize("CHARACTER_S_NOT_FOUND", names.name ?? names.oldName));
}