import { dequote, escapeRegex, globalizeRegex, QuotedContentRegExp, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { toUserMention } from "@rsc-utils/discord-utils";
import type { GuildMember } from "discord.js";
import type { Game } from "../../../model/Game.js";
import type { User as SageUser } from "../../../model/User.js";

/** creates the char mention regexp source for the given mention prefix */
function createCharMentionRegExpSource(mentionPrefix: string) {
	return `${escapeRegex(mentionPrefix)}\\w+|${escapeRegex(mentionPrefix)}(${QuotedContentRegExp.source})`;
}

/** holds the baseline char mention regexp */
const CharMentionRegExp = new RegExp(createCharMentionRegExpSource("@"));
const CharMentionRegExpG = globalizeRegex(CharMentionRegExp);

/** gets the char mention regex as determined by the args */
function getCharMentionRegExpG(mentionPrefix: Optional<string>) {
	return mentionPrefix && mentionPrefix !== "@"
		? new RegExp(createCharMentionRegExpSource(mentionPrefix), "g")
		: CharMentionRegExpG;
}

/** gets a char mention regex w/o global flag but for the specified prefix (if given) and tests the content */
function testCharMentionRegex(content: string, mentionPrefix: Optional<string>): boolean {
	const regex = mentionPrefix && mentionPrefix !== "@"
		? new RegExp(createCharMentionRegExpSource(mentionPrefix))
		: CharMentionRegExp;
	return regex.test(content);
}

type Args = {
	game?: Game;
	gameMasters?: GuildMember[];
	mentionPrefix?: string;
	sageUser: SageUser;
};

export function replaceCharacterMentions(content: string, args: Args): string {
	const { mentionPrefix } = args;
	if (!testCharMentionRegex(content, mentionPrefix)) {
		return content;
	}

	const { game, gameMasters, sageUser } = args;

	const findChar = game
		? (alias: string) => game.findCharacterOrCompanion(alias)
		: (alias: string) => sageUser.findCharacterOrCompanion(alias);

	const gmUserId = game
		/** @todo this logic should default to the first gm ... but this causes headaches for some living servers so we need to implement a way to specify which channels belong to which gms */
		? gameMasters?.find(gm => "online" === gm.presence?.status)?.id
		: undefined;

	const isNpc = gmUserId && game
		? (charId: string) => !!game.gmCharacter.companions.findById(charId) || !!game.nonPlayerCharacters.findById(charId)
		: () => false;

	const mentionPrefixLength = mentionPrefix?.length ?? 1;

	return content.replace(getCharMentionRegExpG(mentionPrefix), mention => {
		// dequote in case we have @"char name" instead of just @alias
		const char = findChar(dequote(mention.slice(mentionPrefixLength)));
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