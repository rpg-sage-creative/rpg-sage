import { autoChannelDataMatches } from "@rsc-sage/data-layer";
import { quote } from "@rsc-utils/core-utils";
import { parseIds, toChannelMention, toUserMention } from "@rsc-utils/discord-utils";
import { deleteMessage } from "../../../../discord/deletedMessages.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { cannotManageCharacter } from "./cannotManageCharacter.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { removeAuto } from "./removeAuto.js";
import { sendGameCharacter } from "./sendGameCharacter.js";
import { sendNotFound } from "./sendNotFound.js";

export async function gcCmdAutoOff(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);

	// initial check of permission to manage characters
	if (await cannotManageCharacter(sageMessage, characterTypeMeta, "AUTO")) {
		return;
	}

	const names = sageMessage.args.getNames();
	const alias = sageMessage.args.getString("alias") ?? undefined;
	const userId = sageMessage.canAdminGame ? sageMessage.args.getUserId("user") ?? sageMessage.sageUser.did : sageMessage.sageUser.did;

	let character = characterTypeMeta.isGm
		? sageMessage.gmCharacter
		: await getCharacter(sageMessage, characterTypeMeta, userId, names, alias);

	if (!character && characterTypeMeta.isPc) {
		character = sageMessage.playerCharacter;
	}

	if (!character) {
		return sendNotFound(sageMessage, `${characterTypeMeta.singularDescriptor} Auto Dialog (Off)`, characterTypeMeta.singularDescriptor!, alias ?? names.name);
	}

	// revalidate access to manage the character
	if (await cannotManageCharacter(sageMessage, characterTypeMeta, "AUTO", character)) {
		return;
	}

	const thisChannelId = sageMessage.threadOrChannelDid;
	const channelIds = parseIds(sageMessage.message, "channel");
	if (!channelIds.length && thisChannelId) {
		channelIds.push(thisChannelId);
	}

	const autoChannelIds = channelIds.filter(channelId => character?.autoChannels.find(channel => autoChannelDataMatches(channel, { channelId, userId })));
	if (!autoChannelIds.length) {
		const label = channelIds.length > 1 ? "those channels" : "that channel";
		return sageMessage.whisper(`You aren't using Auto Dialog with ${character.name} in ${label}.`);
	}

	const channelLinks = channelIds.map(channelId =>
		"\n> " + toChannelMention(channelId) + (channelId === thisChannelId ? " <i>(this channel)</i>" : "")
	);
	const prompt = `Stop ${toUserMention(userId)} using Auto Dialog with ${quote(character.name)} in:${channelLinks.join("")}`;

	const removeAutoArgs = { channelIds:autoChannelIds, game:sageMessage.game, sageUser:sageMessage.sageUser, userId };
	await promptCharConfirm(sageMessage, character, prompt, async char => {
		await removeAuto(removeAutoArgs);
		return char.save();
	});

	const deleted = await deleteMessage(sageMessage.message);
	if (deleted === 1) {
		await sendGameCharacter(sageMessage, character);
	}

	/** @todo change auto to be a command where i list ganme channels and autos for them and provide dropdown selects of characters for each channel to make your selections */
}