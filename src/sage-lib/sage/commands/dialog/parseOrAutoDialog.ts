import { isDefined } from "@rsc-utils/core-utils";
import type { DialogContent } from "@rsc-utils/game-utils";
import { hasImageAttachment } from "../../../../sage-utils/hasImageAttachment.js";
import { EmojiType } from "../../model/HasEmojiCore.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { parseDialogContents } from "./parseDialogContents.js";

export function parseOrAutoDialogContent(sageMessage: SageMessage): DialogContent[] {

	// if we have a command of some kind, we aren't doing dialog
	if (sageMessage.hasCommandOrQueryOrSlicedContent) {
		return [];
	}

	// remove sage command prefix
	const content = sageMessage.slicedContent;

	// check content length; if no content and no image attached, we aren't doing dialog
	if (!content && !hasImageAttachment(sageMessage.message)) {
		return [];
	}

	// get explicit dialog
	const dialogContent = parseDialogContents(sageMessage, content);
	if (dialogContent.length) {
		return dialogContent;
	}

	// if we have the ooc emoji, we aren't doing auto dialog
	const oocEmoji = sageMessage.getEmoji(EmojiType.DialogOutOfCharacter);
	if (oocEmoji && content.includes(oocEmoji)) {
		return [];
	}

	// get userId and channelIds
	const userDid = sageMessage.sageUser.did;
	const channelDids = [sageMessage.threadDid, sageMessage.channelDid].filter(isDefined);

	// check thread then channel for auto dialog
	for (const channelDid of channelDids) {
		// game characters have priority over user characters
		const autoCharacter = sageMessage.game?.getAutoCharacterForChannel(userDid, channelDid)
			?? sageMessage.sageUser.getAutoCharacterForChannel(channelDid);

		if (autoCharacter) {
			const autoChannel = autoCharacter.getAutoChannel({ channelDid, userDid });
			return [{
				type: autoCharacter.type,
				// alias: undefined,
				// who: undefined,
				// attachment: undefined,
				postType: autoChannel?.dialogPostType,
				name: autoCharacter.name,
				// displayName: undefined,
				// title: undefined,
				// imageUrl: undefined,
				// embedColor: undefined,
				content
			}];
		}

	}

	return [];
}
