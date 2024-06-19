import { error } from "@rsc-utils/console-utils";
import type { GameCharacter } from "../../../model/GameCharacter";
import type { ColorType } from "../../../model/HasColorsCore";
import type { SageMessage } from "../../../model/SageMessage";
import type { DialogContent } from "../DialogContent";
import { sendDialogPost } from "../sendDialogPost";
import type { ChatOptions } from "./ChatOptions";
import { toUserMention } from "@rsc-utils/discord-utils";
import type { Optional } from "@rsc-utils/type-utils";

type ChatContent = {
	character?: GameCharacter | null;
	colorType?: ColorType | null;
	dialogContent: DialogContent;
};

function replaceCharacterMention(mention: string, sageMessage: SageMessage, gmUserId: Optional<string>): string {
	const sliced = mention.slice(1);
	let charName: string | undefined;
	let userMention: string | undefined;
	const { game } = sageMessage;
	if (game) {
		const charOrShell = game.findCharacterOrCompanion(sliced);
		if (charOrShell) {
			charName = charOrShell.name;
			const char = "game" in charOrShell ? charOrShell.game : charOrShell;
			if (char) {
				userMention = toUserMention(char.userDid) ?? "";
				if (!userMention && gmUserId) {
					const npc = game.nonPlayerCharacters.findById(char.id);
					if (npc) {
						userMention = toUserMention(gmUserId) ?? "";
					}
				}
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
		return `${charName} (${userMention})`;
	}
	return mention;
}

export async function doChat(sageMessage: SageMessage, { character, colorType, dialogContent }: ChatContent, options: ChatOptions): Promise<void> {
	if (character) {
		let { content, displayName, imageUrl, embedColor, postType } = dialogContent;

		// do some content manipulation
		const nameRegex = /{name}/gi;
		if (nameRegex.test(content)) {
			content = content.replace(nameRegex, displayName ?? character.name);
		}
		const aliasRegex = /@\w+/g;
		if (aliasRegex.test(content)) {
			const gmUserId = await sageMessage.game?.gmGuildMember();
			content = content.replace(aliasRegex, mention => replaceCharacterMention(mention, sageMessage, gmUserId?.id));
		}

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