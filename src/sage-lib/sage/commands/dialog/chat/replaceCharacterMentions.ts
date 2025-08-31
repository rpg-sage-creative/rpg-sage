import { dequote, getQuotedRegex, type Snowflake } from "@rsc-utils/core-utils";
import { toUserMention } from "@rsc-utils/discord-utils";
import { regex } from "regex";
import { SageMessage } from "../../../model/SageMessage.js";

export async function replaceCharacterMentions(sageMessage: SageMessage, content: string): Promise<string> {
	const charMentionRegex = regex("g")`@\w+|@(?:${getQuotedRegex({ contents:"+" })})`;
	if (!charMentionRegex.test(content)) {
		return content;
	}

	const { game, sageUser } = sageMessage;
	const gmUser = await game?.gmGuildMember();
	const gmUserId = gmUser?.id;

	return content.replace(charMentionRegex, mention => {
		const sliced = dequote(mention.slice(1));
		let charName: string | undefined;
		let userMention: string | undefined;
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
							userMention = toUserMention(gmUserId as Snowflake) ?? "";
						}
					}
				}
			}
		}else {
			const char = sageUser.findCharacterOrCompanion(sliced);
			if (char) {
				charName = char.name;
				userMention = toUserMention(char.userDid) ?? "";
			}
		}
		if (charName && userMention) {
			return `${charName} (${userMention})`;
		}
		return mention;
	});
}