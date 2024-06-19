import { error } from "@rsc-utils/console-utils";
import type { GameCharacter } from "../../../model/GameCharacter";
import type { ColorType } from "../../../model/HasColorsCore";
import type { SageMessage } from "../../../model/SageMessage";
import type { DialogContent } from "../DialogContent";
import { sendDialogPost } from "../sendDialogPost";
import type { ChatOptions } from "./ChatOptions";
import { toUserMention } from "@rsc-utils/discord-utils";

type ChatContent = {
	character?: GameCharacter | null;
	colorType?: ColorType | null;
	dialogContent: DialogContent;
};

function replaceCharacterMention(mention: string, sageMessage: SageMessage): string {
	const sliced = mention.slice(1);
	let charName: string | undefined;
	let userMention: string | undefined;
	if (sageMessage.game) {
		const charOrShell = sageMessage.game.findCharacterOrCompanion(sliced);
		if (charOrShell) {
			charName = charOrShell.name;
			if ("game" in charOrShell) {
				userMention = toUserMention(charOrShell.game?.userDid) ?? "";
			}else {
				userMention = toUserMention(charOrShell.userDid) ?? "";
			}
		}
	}else {
		const char = sageMessage.sageUser.findCharacterOrCompanion(sliced);
		if (char) {
			charName = char.name;
			userMention = toUserMention(char.userDid) ?? "";
		}
	}
	if (charName && userMention) {
		return `${userMention} (${charName})`;
	}
	return mention;
}

export async function doChat(sageMessage: SageMessage, { character, colorType, dialogContent }: ChatContent, options: ChatOptions): Promise<void> {
	if (character) {
		let { content, displayName, imageUrl, embedColor, postType } = dialogContent;

		// do some content manipulation
		content = content.replace(/{name}/gi, displayName ?? character.name);
		content = content.replace(/@\w+/g, mention => replaceCharacterMention(mention, sageMessage));

		await sendDialogPost(sageMessage, {
			authorName: displayName, // defaults to character.name
			character,
			colorType: colorType ?? undefined,
			content,
			imageUrl,
			embedColor,
			postType,
		}, options).catch(error);
	}else {
		await sageMessage.reactWarn(`Unable to find character for dialog: "${dialogContent.alias ?? dialogContent.type}::"`);
	}
}