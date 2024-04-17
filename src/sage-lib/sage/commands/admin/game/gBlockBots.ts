import { getRollemId, getTupperBoxId } from "@rsc-utils/env-utils";
import type { Game } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { TextChannel } from "discord.js";
import { isDefined } from "@rsc-utils/type-utils";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import { blockFromChannel } from "../../../../discord/permissions/blockFromChannel.js";
import { toHumanReadable } from "@rsc-utils/discord-utils";

/** Prompts to block Tupper/Rollem if they have access to your channels. Returns true if a change was made. */
export async function gBlockBots(sageCommand: SageCommand, _game?: Game): Promise<boolean> {
	const game = _game ?? sageCommand.game;
	if (!game) {
		return false;
	}


	const sageGuildMember = await sageCommand.discord.fetchGuildMember(sageCommand.bot.did);
	if (!sageGuildMember) {
		return false;
	}

	const botNames = ["Tupperbox", "Rollem"];
	const bots = [
		await sageCommand.discord.fetchGuildMember(getTupperBoxId()),
		await sageCommand.discord.fetchGuildMember(getRollemId()),
	].map((bot, index) => bot ? { guildMember:bot, name:botNames[index] } : null).filter(isDefined);

	let changed = false;

	for (const bot of bots) {
		const channelsNotBlocked: TextChannel[] = [];

		const gameChannels = game.channels;
		for (const gameChannel of gameChannels) {
			const guildChannel = await sageCommand.discord.fetchChannel<TextChannel>(gameChannel.id);
			if (guildChannel) {
				if (guildChannel.permissionsFor(bot.guildMember).has("VIEW_CHANNEL")) {
					channelsNotBlocked.push(guildChannel);
				}
			}
		}

		if (!channelsNotBlocked.length) {
			continue;
		}

		const message = [
			`${bot.name} is allowed in ${channelsNotBlocked.length} channel(s).`,
			`Block ${bot.name} from this Game's channels?`
		].join("\n");

		const block = await discordPromptYesNo(sageCommand, message);
		if (!block) {
			continue;
		}

		const unable: string[] = [];
		for (const guildChannel of channelsNotBlocked) {
			const results = await blockFromChannel(sageGuildMember, guildChannel, bot.guildMember);
			if (results.fixSuccess) {
				changed = true;
			}else if (!results.blockCorrect) {
				unable.push(`<i>Unable to block ${bot.name} from #${toHumanReadable(guildChannel)}</i>`);
			}
		}

		if (unable.length) {
			await sageCommand.reply(unable.join("<br/>"));
		}
	}

	return changed;
}