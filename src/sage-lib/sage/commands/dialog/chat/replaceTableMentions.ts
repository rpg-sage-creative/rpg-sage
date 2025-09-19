import { escapeRegex } from "@rsc-utils/core-utils";
import { toUserMention } from "@rsc-utils/discord-utils";
import type { GuildMember, User } from "discord.js";
import type { SageCommand } from "../../../model/SageCommand.js";

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

type GuildMemberOrUser = GuildMember | User;

async function fetchGameMasters(sageCommand: SageCommand): Promise<GuildMemberOrUser[]> {
	const gameMasters = await sageCommand.game?.gmGuildMembers();
	return gameMasters ?? [];
}

async function fetchPlayers(sageCommand: SageCommand): Promise<GuildMemberOrUser[]> {
	const players = await sageCommand.game?.pGuildMembers();
	return players ?? [];
}

async function fetchTable(sageCommand: SageCommand): Promise<GuildMemberOrUser[]> {
	return [
		...await fetchGameMasters(sageCommand),
		...await fetchPlayers(sageCommand),
	];
}

export async function replaceTableMentions(sageCommand: SageCommand, content: string): Promise<string> {
	if (!sageCommand.game) {
		return content;
	}

	/** @todo add .tableMentionPrefix to Game and Server */
	const prefix = "@";

	const groups = [
		{ regex:getAtGameMastersRegex(prefix), fetcher:fetchGameMasters, label:"GameMasters" },
		{ regex:getAtPlayersRegex(prefix), fetcher:fetchPlayers, label:"Players" },
		{ regex:getAtTableRegex(prefix), fetcher:fetchTable, label:"Table" },
	];

	for (const { regex, fetcher, label } of groups) {
		const match = regex.exec(content);
		if (match) {
			const members = await fetcher(sageCommand);
			const mentions = members.map(toUserMention);
			const replacement = `@${label} (${mentions.join(", ")})`;
			const left = content.slice(0, match.index);
			const right = content.slice(match.index + match[0].length);
			content = `${left}${replacement}${right}`;
		}
	}

	return content;
}