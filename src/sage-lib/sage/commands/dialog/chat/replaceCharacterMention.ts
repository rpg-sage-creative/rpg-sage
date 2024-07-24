import type { Snowflake } from "@rsc-utils/core-utils";
import { toUserMention } from "@rsc-utils/discord-utils";
import { dequote, getQuotedRegexSource } from "@rsc-utils/string-utils";
import XRegExp from "xregexp";
import { SageMessage } from "../../../model/SageMessage.js";

export async function replaceCharacterMention(sageMessage: SageMessage, content: string): Promise<string> {
	const charMentionRegex = XRegExp(`@\\w+|@${getQuotedRegexSource()}`, "g");
	if (!charMentionRegex.test(content)) {
		return content;
	}

	const gmUser = await sageMessage.game?.gmGuildMember();
	const gmUserId = gmUser?.id;

	return content.replace(charMentionRegex, mention => {
		const sliced = dequote(mention.slice(1));
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
							userMention = toUserMention(gmUserId as Snowflake) ?? "";
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
	});
}