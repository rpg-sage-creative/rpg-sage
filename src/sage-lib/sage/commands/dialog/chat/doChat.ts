import { error } from "@rsc-utils/console-utils";
import type { GameCharacter } from "../../../model/GameCharacter";
import type { ColorType } from "../../../model/HasColorsCore";
import type { SageMessage } from "../../../model/SageMessage";
import type { DialogContent } from "../DialogContent";
import { sendDialogPost } from "../sendDialogPost";
import type { ChatOptions } from "./ChatOptions";
import { replaceCharacterMention } from "./replaceCharacterMention";

type ChatContent = {
	character?: GameCharacter | null;
	colorType?: ColorType | null;
	dialogContent: DialogContent;
};

export async function doChat(sageMessage: SageMessage, { character, colorType, dialogContent }: ChatContent, options: ChatOptions): Promise<void> {
	if (character) {
		let { content, displayName, imageUrl, embedColor, postType } = dialogContent;

		// do some content manipulation
		const nameRegex = /{name}/gi;
		if (nameRegex.test(content)) {
			content = content.replace(nameRegex, displayName ?? character.name);
		}
		content = await replaceCharacterMention(sageMessage, content);

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