import type { Snowflake } from "@rsc-utils/core-utils";
import { toChannelMention } from "@rsc-utils/discord-utils";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { removeAuto } from "./removeAuto.js";
import { sendNotFound } from "./sendNotFound.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdAutoOff(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	let name = sageMessage.args.removeAndReturnName();
	let character = characterTypeMeta.isGm
		? sageMessage.gmCharacter
		: await getCharacter(sageMessage, characterTypeMeta, sageMessage.sageUser.did, { name });

		if (!character && characterTypeMeta.isPc) {
		character = sageMessage.playerCharacter;
	}

	if (!character) {
		return sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-auto-off`, characterTypeMeta.singularDescriptor!, name);
	}

	const channelDids = sageMessage.message.mentions.channels.map(ch => ch.id as Snowflake);
	const autoChannelDids = channelDids.filter(did => character?.autoChannels.find(channel => channel.channelDid === did));
	if (autoChannelDids.length) {
		const channelLinks = autoChannelDids.map(channelDid => toChannelMention(channelDid));
		const prompt = autoChannelDids.length > 1 || autoChannelDids[0] !== sageMessage.channelDid
			? `Stop using Auto Dialog with ${character.name} for the given channel(s)?\n> ${channelLinks.join("\n> ")}`
			: `Stop using Auto Dialog with ${character.name}?`;

		return promptCharConfirm(sageMessage, character, prompt, async char => {
			await removeAuto(sageMessage, ...autoChannelDids);
			return char.save();
		});
	}

	const label = channelDids.length > 1 ? "those channels" : "that channel";
	await sageMessage.whisper(`You aren't using Auto Dialog with ${character.name} in ${label}.`);

	/** @todo change auto to be a command where i list ganme channels and autos for them and provide dropdown selects of characters for each channel to make your selections */
}