import { isDefined } from "@rsc-utils/core-utils";
import { blockFromChannel, getPermsFor, getRollemId, getTupperBoxId, toChannelName, type SupportedCategoryChannel, type SupportedGameChannel } from "@rsc-utils/discord-utils";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { Game } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";

const DISABLE_TIL_FURTHER_NOTICE = true;

/** Prompts to block Tupper/Rollem if they have access to your channels. Returns true if a change was made. */
export async function gBlockBots(sageCommand: SageCommand, _game?: Game): Promise<boolean> {
	if (DISABLE_TIL_FURTHER_NOTICE) return false; // NOSONAR

	const game = _game ?? sageCommand.game;
	if (!game) {
		return false;
	}


	const sageGuildMember = await sageCommand.discord.fetchGuildMember(sageCommand.bot.id);
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
		const channelsNotBlocked: (SupportedGameChannel | SupportedCategoryChannel)[] = [];

		const validatedChannels = await game.validateChannels(true);
		const gameChannels = validatedChannels.filter(vc => !vc.byParent);
		for (const gameChannel of gameChannels) {
			const guildChannel = gameChannel.discord;
			if (guildChannel && !guildChannel.isThread()) {
				const sagePerms = getPermsFor(guildChannel, sageGuildMember);
				if (!sagePerms.can("ViewChannel") || !sagePerms.can("ManageChannels")) {
					continue;
				}
				const botPerms = getPermsFor(guildChannel, bot.guildMember);
				if (botPerms.can("ViewChannel")) {
					channelsNotBlocked.push(guildChannel);
				}
			}
		}

		if (!channelsNotBlocked.length) {
			continue;
		}

		const message = [
			`${bot.name} is allowed in ${channelsNotBlocked.length} channel(s).`,
			`Block ${bot.name} from these channels?`
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
				unable.push(`<i>Unable to block ${bot.name} from ${toChannelName(guildChannel)}</i>`);
			}
		}

		if (unable.length) {
			await sageCommand.dChannel?.send(unable.join("<br/>"));
		}
	}

	return changed;
}