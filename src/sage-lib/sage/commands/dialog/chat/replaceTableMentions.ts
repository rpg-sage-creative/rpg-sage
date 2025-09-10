import { toUserMention } from "@rsc-utils/discord-utils";
import type { GuildMember, User } from "discord.js";
import { SageMessage } from "../../../model/SageMessage.js";

const AtGameMastersRegex = /@(?:gms?|gamemasters?)/i;
const AtPlayersRegex = /@(?:pcs?|players?)/i;
const AtTableRegex = /@table/i;

type GuildMemberOrUser = GuildMember | User;

async function fetchGameMasters(sageMessage: SageMessage): Promise<GuildMemberOrUser[]> {
	const gameMasters = await sageMessage.game?.gmGuildMembers();
	return gameMasters ?? [];
}

async function fetchPlayers(sageMessage: SageMessage): Promise<GuildMemberOrUser[]> {
	const players = await sageMessage.game?.pGuildMembers();
	return players ?? [];
}

async function fetchTable(sageMessage: SageMessage): Promise<GuildMemberOrUser[]> {
	return [
		...await fetchGameMasters(sageMessage),
		...await fetchPlayers(sageMessage),
	];
}

export async function replaceTableMentions(sageMessage: SageMessage, content: string): Promise<string> {
	if (!sageMessage.game) {
		return content;
	}

	const groups = [
		{ regex:AtGameMastersRegex, fetcher:fetchGameMasters, label:"GameMasters" },
		{ regex:AtPlayersRegex, fetcher:fetchPlayers, label:"Players" },
		{ regex:AtTableRegex, fetcher:fetchTable, label:"Table" },
	];

	for (const { regex, fetcher, label } of groups) {
		const match = regex.exec(content);
		if (match) {
			const members = await fetcher(sageMessage);
			const mentions = members.map(toUserMention);
			const replacement = `@${label} (${mentions.join(", ")})`;
			const left = content.slice(0, match.index);
			const right = content.slice(match.index + match[0].length);
			content = `${left}${replacement}${right}`;
		}
	}

	return content;
}