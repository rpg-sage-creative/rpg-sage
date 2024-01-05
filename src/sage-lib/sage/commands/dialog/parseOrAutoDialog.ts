import { exists } from "../../../../sage-utils/utils/ArrayUtils/Filters";
import type SageMessage from "../../model/SageMessage";
import type { DialogContent } from "./DialogContent";
import { parseDialogContents } from "./parseDialogContents";

export function parseOrAutoDialogContent(sageMessage: SageMessage): DialogContent[] {
	const content = sageMessage.slicedContent;
	const dialogContent = parseDialogContents(sageMessage, content);
	if (dialogContent.length) {
		return dialogContent;
	}

	if (!sageMessage.hasCommandOrQueryOrSlicedContent) {
		const userDid = sageMessage.sageUser.did;
		const channelDids = [sageMessage.threadDid, sageMessage.channelDid].filter(exists);
		for (const channelDid of channelDids) {
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
					content: sageMessage.slicedContent
				}];
			}
		}
	}

	return [];
}
