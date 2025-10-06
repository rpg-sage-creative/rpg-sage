import { escapeRegex } from "@rsc-utils/core-utils";
import { toUserMention } from "@rsc-utils/discord-utils";
import type { GuildMember } from "discord.js";

const AtGameMastersRegex = /@(?:gms?|gamemasters?)/i;
const AtPlayersRegex = /@(?:pcs?|players?|party)/i;
const AtTableRegex = /@table/i;

function updatePrefix(regexp: RegExp, prefix: string): RegExp {
	if (prefix !== "@") {
		return new RegExp(`${escapeRegex(prefix)}${regexp.source.slice(1)}`, "i");
	}
	return regexp;
}

function getAtGameMastersRegex(prefix: string): RegExp {
	return updatePrefix(AtGameMastersRegex, prefix);
}

function getAtPlayersRegex(prefix: string): RegExp {
	return updatePrefix(AtPlayersRegex, prefix);
}

function getAtTableRegex(prefix: string): RegExp {
	return updatePrefix(AtTableRegex, prefix);
}

type Args = {
	gameMasters?: GuildMember[];
	players?: GuildMember[];
	/** @todo add .tableMentionPrefix to Game and Server */
	mentionPrefix?: string;
};

export function replaceTableMentions(content: string, { gameMasters = [], players = [], mentionPrefix = "@" }: Args): string {
	if (!gameMasters.length && !players.length) {
		return content;
	}

	const groups = [
		{ regex:getAtGameMastersRegex(mentionPrefix), members:gameMasters, label:"GameMasters" },
		{ regex:getAtPlayersRegex(mentionPrefix), members:players, label:"Players" },
		{ regex:getAtTableRegex(mentionPrefix), members:gameMasters.concat(players), label:"Table" },
	];

	for (const { regex, members, label } of groups) {
		const match = regex.exec(content);
		if (match) {
			const mentions = members.map(toUserMention);
			const replacement = `@${label} (${mentions.join(", ")})`;
			const left = content.slice(0, match.index);
			const right = content.slice(match.index + match[0].length);
			content = `${left}${replacement}${right}`;
		}
	}

	return content;
}