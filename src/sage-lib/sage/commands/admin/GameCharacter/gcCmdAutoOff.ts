import { parseIds, toChannelMention, toUserMention } from "@rsc-utils/discord-utils";
import { deleteMessage } from "../../../../discord/deletedMessages.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { removeAuto } from "./removeAuto.js";
import { sendGameCharacter } from "./sendGameCharacter.js";
import { sendNotFound } from "./sendNotFound.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdAutoOff(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	const names = sageMessage.args.getNames();
	const alias = sageMessage.args.getString("alias") ?? undefined;
	const userId = sageMessage.actor.isGamePlayer ? sageMessage.sageUser.did : sageMessage.args.getUserId("user") ?? sageMessage.sageUser.did;

	let character = characterTypeMeta.isGm
		? sageMessage.gmCharacter
		: await getCharacter(sageMessage, characterTypeMeta, userId, names, alias);

	if (!character && characterTypeMeta.isPc) {
		character = sageMessage.playerCharacter;
	}

	if (!character) {
		return sendNotFound(sageMessage, `${characterTypeMeta.singularDescriptor} Auto Dialog (Off)`, characterTypeMeta.singularDescriptor!, { name:alias ?? names.name });
	}

	const channelIds = parseIds(sageMessage.message, "channel");
	const autoChannelIds = channelIds.filter(channelId => character?.autoChannels.find(channel => channel.channelDid === channelId && channel.userDid === userId));
	if (!autoChannelIds.length) {
		const label = channelIds.length > 1 ? "those channels" : "that channel";
		return sageMessage.whisper(`You aren't using Auto Dialog with ${character.name} in ${label}.`);
	}

	const channelLinks = autoChannelIds.map(channelId => toChannelMention(channelId));
	const prompt = autoChannelIds.length > 1 || autoChannelIds[0] !== sageMessage.channelDid
		? `Stop ${toUserMention(userId)} using Auto Dialog with ${character.name} in the given channel(s)?\n> ${channelLinks.join("\n> ")}`
		: `Stop ${toUserMention(userId)} using Auto Dialog with ${character.name}?`;

	await promptCharConfirm(sageMessage, character, prompt, async char => {
		await removeAuto(sageMessage, { userId, channelIds:autoChannelIds });
		return char.save();
	});

	const deleted = await deleteMessage(sageMessage.message);
	if (deleted === 1) {
		await sendGameCharacter(sageMessage, character);
	}

	/** @todo change auto to be a command where i list ganme channels and autos for them and provide dropdown selects of characters for each channel to make your selections */
}