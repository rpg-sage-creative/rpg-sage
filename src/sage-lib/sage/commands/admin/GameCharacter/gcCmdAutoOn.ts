import { DialogPostType } from "@rsc-sage/types";
import { toChannelMention } from "@rsc-utils/discord-utils";
import type { SageMessage } from "../../../model/SageMessage.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { promptCharConfirm } from "./promptCharConfirm.js";
import { removeAndReturnChannelDids } from "./removeAndReturnChannelDids.js";
import { removeAuto } from "./removeAuto.js";
import { sendNotFound } from "./sendNotFound.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";

export async function gcCmdAutoOn(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	// MUST RUN removeAndReturnChannelDids BEFORE NAME
	const channelDids = await removeAndReturnChannelDids(sageMessage);
	const dialogPostType = sageMessage.args.getEnum(DialogPostType, "dialogPostType") ?? undefined;

	let name = sageMessage.args.removeAndReturnName();
	let character = characterTypeMeta.isGm
		? sageMessage.gmCharacter
		: await getCharacter(sageMessage, characterTypeMeta, sageMessage.sageUser.did, { name });
	if (!character && characterTypeMeta.isPc) {
		character = sageMessage.playerCharacter;
	}

	if (character) {
		const channelLinks = channelDids.map(channelDid => toChannelMention(channelDid));
		const dialogType = dialogPostType !== undefined ? ` (${DialogType[dialogPostType]})` : "";
		const prompt = channelDids.length > 1 || channelDids[0] !== sageMessage.channelDid
			? `Use Auto Dialog ${dialogType} with ${character.name} for the given channel(s)?\n> ${channelLinks.join("\n> ")}`
			: `Use Auto Dialog ${dialogType} with ${character.name}?`;

		return promptCharConfirm(sageMessage, character, prompt, async char => {
			await removeAuto(sageMessage, ...channelDids);
			const userDid = sageMessage.sageUser.did;
			for (const channelDid of channelDids) {
				await char.setAutoChannel({ channelDid, dialogPostType, userDid }, false);
			}
			return char.save();
		});
	}
	return sendNotFound(sageMessage, `${characterTypeMeta.commandDescriptor}-auto-on`, characterTypeMeta.singularDescriptor!, name);
}