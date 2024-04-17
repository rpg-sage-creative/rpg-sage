import { toChannelMention } from "@rsc-utils/discord-utils";
import { GameCharacter } from "../../../model/GameCharacter";
import type { SageMessage } from "../../../model/SageMessage";
import { getCharacter } from "./getCharacter";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { promptCharConfirm } from "./promptCharConfirm";
import { removeAndReturnChannelDids } from "./removeAndReturnChannelDids";
import { removeAuto } from "./removeAuto";
import { sendNotFound } from "./sendNotFound";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

export async function gcCmdAutoOff(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	// removeAndReturnChannelDids MUST RUN BEFORE removeAndReturnName
	const channelDids = await removeAndReturnChannelDids(sageMessage);

	let name = sageMessage.args.removeAndReturnName();
	if (characterTypeMeta.isGm) {
		name = sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
	}

	let character = await getCharacter(sageMessage, characterTypeMeta, sageMessage.sageUser.did, { name });
	if (!character && characterTypeMeta.isPc) {
		character = sageMessage.playerCharacter;
	}

	if (!character) {
		return sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-auto-off`, characterTypeMeta.singularDescriptor!, name);
	}

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
}