import { error } from "@rsc-utils/console-utils";
import type GameCharacter from "../../../model/GameCharacter";
import type { ColorType } from "../../../model/HasColorsCore";
import type SageMessage from "../../../model/SageMessage";
import type { DialogContent } from "../DialogContent";
import { sendDialogPost } from "../sendDialogPost";
import type { ChatOptions } from "./ChatOptions";

type ChatContent = {
	character?: GameCharacter | null;
	colorType?: ColorType | null;
	dialogContent: DialogContent;
};

export async function doChat(sageMessage: SageMessage, { character, colorType, dialogContent }: ChatContent, options: ChatOptions): Promise<void> {
	if (character) {
		await sendDialogPost(sageMessage, {
			authorName: dialogContent.displayName, // defaults to character.name
			character,
			colorType: colorType ?? undefined,
			content: dialogContent.content.replace(/{name}/gi, dialogContent.displayName ?? character.name),
			imageUrl: dialogContent.imageUrl,
			embedColor: dialogContent.embedColor,
			postType: dialogContent.postType,
		}, options).catch(error);
	}else {
		await sageMessage.reactWarn(`Unable to find character for dialog: "${dialogContent.alias ?? dialogContent.type}::"`);
	}
}