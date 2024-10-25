import { isDefined } from "@rsc-utils/core-utils";
import { EmojiType } from "../../model/HasEmojiCore.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { DialogContent } from "./DialogContent.js";
import { parseDialogContents } from "./parseDialogContents.js";

export function parseOrAutoDialogContent(sageMessage: SageMessage): DialogContent[] {
	const content = sageMessage.slicedContent;
	const dialogContent = parseDialogContents(sageMessage, content);
	if (dialogContent.length) {
		return dialogContent;
	}

	if (!sageMessage.hasCommandOrQueryOrSlicedContent) {
		const oocEmoji = sageMessage.getEmoji(EmojiType.DialogOutOfCharacter);
		if (oocEmoji && content.includes(oocEmoji)) {
			return [];
		}

		const userDid = sageMessage.sageUser.did;
		const channelDids = [sageMessage.threadDid, sageMessage.channelDid].filter(isDefined);
		for (const channelDid of channelDids) {
			const autoCharacter = sageMessage.game?.getAutoCharacterForChannel(userDid, channelDid)
				?? sageMessage.sageUser.getAutoCharacterForChannel(channelDid);
			if (autoCharacter) {


				// check content length; if no content and no image attached, fail out
				if (!content) {
					let hasImage = false;
					for (const att of sageMessage.message.attachments.values()) {
						if (att.contentType?.match(/image/i) && att.url) {
							hasImage = true;
							break;
						}
					}
					if (!hasImage) {
						return [];
					}
				}


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
	}

	return [];
}
