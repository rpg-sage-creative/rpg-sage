import { error } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { ColorType } from "../../../model/HasColorsCore.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { DialogContent } from "../DialogContent.js";
import { sendDialogPost } from "../sendDialogPost.js";
import type { ChatOptions } from "./ChatOptions.js";
import { replaceCharacterMentions } from "./replaceCharacterMentions.js";
import { replaceTableMentions } from "./replaceTableMentions.js";

type ChatContent = {
	character?: GameCharacter | null;
	colorType?: ColorType | null;
	dialogContent: DialogContent;
};

export async function doChat(sageMessage: SageMessage, { character, colorType, dialogContent }: ChatContent, options: ChatOptions): Promise<void> {
	if (character) {
		let { content, displayName, embedImageUrl, dialogImageUrl, embedColor, postType } = dialogContent;

		// do some content manipulation
		const nameRegex = /{name}/gi;
		if (nameRegex.test(content)) {
			content = content.replace(nameRegex, displayName ?? character.name);
		}

		content = await replaceCharacterMentions(sageMessage, content);
		content = await replaceTableMentions(sageMessage, content);

		await sendDialogPost(sageMessage, {
			authorName: displayName, // defaults to character.name
			character,
			colorType: colorType ?? undefined,
			content,
			dialogImageUrl,
			embedColor,
			embedImageUrl,
			postType,
		}, options).catch(error);
	}else {
		await sageMessage.reactWarn(`Unable to find character for dialog: "${dialogContent.alias ?? dialogContent.type}::"`);
	}
}