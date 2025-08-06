import { DialogPostType } from "@rsc-sage/types";
import { parseIds, toChannelMention, toUserMention } from "@rsc-utils/discord-utils";
import { deleteMessage } from "../../../../discord/deletedMessages.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { removeAuto } from "./removeAuto.js";
import { sendGameCharacter } from "./sendGameCharacter.js";
import { sendNotFound } from "./sendNotFound.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdAutoOn(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const names = sageMessage.args.getNames();
	const alias = sageMessage.args.getString("alias") ?? undefined;
	const dialogPostType = sageMessage.args.getEnum(DialogPostType, "dialogPostType") ?? undefined;
	const userId = sageMessage.canAdminGame ? sageMessage.args.getUserId("user") ?? sageMessage.sageUser.did : sageMessage.sageUser.did;

	if (sageMessage.game && userId !== sageMessage.sageUser.did) {
		const hasUser = characterTypeMeta.isGmOrNpcOrMinion ? sageMessage.actor.isGameMaster : sageMessage.actor.isGameUser;
		if (!hasUser) {
			return characterTypeMeta.isGmOrNpcOrMinion
				? sageMessage.whisper(`${toUserMention(userId)} isn't a Game Master of the Game.`)
				: sageMessage.whisper(`${toUserMention(userId)} isn't part of the Game.`);
		}
	}

	let character = characterTypeMeta.isGm
		? sageMessage.gmCharacter
		: await getCharacter(sageMessage, characterTypeMeta, userId, names, alias);

	if (!character && characterTypeMeta.isPc) {
		character = sageMessage.playerCharacter;
	}

	if (!character) {
		return sendNotFound(sageMessage, `${characterTypeMeta.singularDescriptor} Auto Dialog (On)`, characterTypeMeta.singularDescriptor!, { name:alias ?? names.name });
	}

	const channelIds = parseIds(sageMessage.message, "channel");
	const channelLinks = channelIds.map(channelId => toChannelMention(channelId));
	const dialogType = dialogPostType !== undefined ? ` (${DialogType[dialogPostType]})` : "";
	const prompt = channelIds.length > 1 || channelIds[0] !== sageMessage.channelDid
		? `Start ${toUserMention(userId)} using Auto Dialog ${dialogType} with ${character.name} in the given channel(s)?\n> ${channelLinks.join("\n> ")}`
		: `Start ${toUserMention(userId)} using Auto Dialog ${dialogType} with ${character.name}?`;

	await promptCharConfirm(sageMessage, character, prompt, async char => {
		await removeAuto(sageMessage, { userId, channelIds });
		for (const channelDid of channelIds) {
			await char.setAutoChannel({ channelDid, dialogPostType, userDid:userId }, false);
		}
		return char.save();
	});

	const deleted = await deleteMessage(sageMessage.message);
	if (deleted === 1) {
		await sendGameCharacter(sageMessage, character);
	}

}