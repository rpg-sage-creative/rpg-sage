import { DiscordId } from "../../../../discord";
import { GameCharacter } from "../../../model/GameCharacter";
import type { SageMessage } from "../../../model/SageMessage";
import { DialogType } from "../../../repo/base/IdRepository";
import { getCharacter } from "./getCharacter";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { promptCharConfirm } from "./promptCharConfirm";
import { removeAndReturnChannelDids } from "./removeAndReturnChannelDids";
import { removeAuto } from "./removeAuto";
import { sendNotFound } from "./sendNotFound";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

export async function gcCmdAutoOn(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock();
	}

	// MUST RUN removeAndReturnChannelDids BEFORE NAME
	const channelDids = await removeAndReturnChannelDids(sageMessage);
	const dialogPostType = sageMessage.args.removeAndReturnDialogType() ?? undefined;

	let name = sageMessage.args.removeAndReturnName();
	if (characterTypeMeta.isGm) {
		name = sageMessage.game?.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
	}
	let character = await getCharacter(sageMessage, characterTypeMeta, sageMessage.sageUser.did, { name });
	if (!character && characterTypeMeta.isPc) {
		character = sageMessage.playerCharacter;
	}

	if (character) {
		const channelLinks = channelDids.map(channelDid => DiscordId.toChannelReference(channelDid));
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