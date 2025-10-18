import { escapeRegex, type Snowflake } from "@rsc-utils/core-utils";
import { toUserMention } from "@rsc-utils/discord-utils";
import { dequote, QuotedContentRegExp } from "@rsc-utils/core-utils";
import type { GuildMember } from "discord.js";
import type { Game } from "../../../model/Game.js";
import type { User as SageUser } from "../../../model/User.js";
import { regex } from "regex";

/** holds the baseline char mention regex */
const CharMentionRegExp = regex`@(\w+|${QuotedContentRegExp})`;

/** gets the char mention regex as determined by the args */
function getCharMentionRegex({ gFlag, mentionPrefix = "@" }: { gFlag?:"g"; mentionPrefix?:string; } ): RegExp {
	if (mentionPrefix !== "@" || gFlag === "g") {
		return new RegExp(`${escapeRegex(mentionPrefix)}${CharMentionRegExp.source.slice(1)}`, gFlag);
	}
	return CharMentionRegExp;
}

/** gets a char mention regex w/o global flag but for the specified prefix (if given) and tests the content */
function testCharMentionRegex(content: string, args: { mentionPrefix?:string; }): boolean {
	return getCharMentionRegex(args).test(content ?? "");
}

type Args = {
	game?: Game;
	gameMasters?: GuildMember[];
	mentionPrefix?: string;
	sageUser: SageUser;
};

export function replaceCharacterMentions(content: string, args: Args): string {
	if (!testCharMentionRegex(content, args)) {
		return content;
	}

	const { game, gameMasters, mentionPrefix, sageUser } = args;

	const findChar = game
		? (alias: string) => game.findCharacterOrCompanion(alias)
		: (alias: string) => sageUser.findCharacterOrCompanion(alias);

	const gmUserId = game ? gameMasters?.find(gm => "online" === gm.presence?.status)?.id : undefined;

	const isNpc = gmUserId && game
		? (charId: string) => !!game.gmCharacter.companions.findById(charId) || !!game.nonPlayerCharacters.findById(charId)
		: () => false;

	return content.replace(getCharMentionRegex({ mentionPrefix, gFlag:"g" }), mention => {
		const char = findChar(dequote(mention.slice(1)));
		const charName = char?.name;
		let userMention: string | undefined;
		if (char) {
			userMention = toUserMention(char.userId) ?? "";
			if (!userMention && isNpc(char.id)) {
				userMention = toUserMention(gmUserId as Snowflake) ?? "";
			}
		}
		if (charName && userMention) {
			return `${charName} (${userMention})`;
		}
		return mention;
	});
}