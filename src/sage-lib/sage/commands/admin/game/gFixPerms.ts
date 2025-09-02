import { fixMissingChannelPerms, getPermsFor, getRequiredPermissions, toChannelName, type SupportedCategoryChannel, type SupportedGameChannel } from "@rsc-utils/discord-utils";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { Game } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";

const DISABLE_TIL_FURTHER_NOTICE = true;

/** Fixes Sage's perms for the game's channels. Returns true if a change was made. */
export async function gFixPerms(sageCommand: SageCommand, _game?: Game): Promise<boolean> {
	if (DISABLE_TIL_FURTHER_NOTICE) return false; // NOSONAR

	const game = _game ?? sageCommand.game;
	if (!game) {
		return false;
	}

	const bot = await sageCommand.discord.fetchGuildMember(sageCommand.bot.id);
	if (!bot) {
		return false;
	}

	const channelsMissingPerms: (SupportedGameChannel | SupportedCategoryChannel)[] = [];
	const validatedChannels = await game.validateChannels(true);
	const gameChannels = validatedChannels.filter(vc => !vc.byParent);
	let cannotView = 0;
	for (const gameChannel of gameChannels) {
		const guildChannel = gameChannel.discord;
		if (guildChannel) {
			const perms = getPermsFor(guildChannel, bot, ...getRequiredPermissions("RunGame"));
			if (!perms.can("ViewChannel")) {
				cannotView++;
			}
			if (perms.missing.length) {
				channelsMissingPerms.push(guildChannel);
			}
		}
	}

	if (!channelsMissingPerms.length) {
		return false;
	}

	if (cannotView) {
		await sageCommand.replyStack.reply(`RPG Sage cannot see ${cannotView} channel(s).\nPlease have a server admin fix RPG Sage's permissions.`);
		return false;
	}

	const message = [
		`RPG Sage is missing permissions for ${channelsMissingPerms.length} channel(s).`,
		`Fix RPG Sage's Permissions?`
	].join("\n");

	const fix = await discordPromptYesNo(sageCommand, message);
	if (!fix) {
		return false;
	}

	let changed = false;

	const unable: string[] = [];
	for (const guildChannel of channelsMissingPerms) {
		const results = await fixMissingChannelPerms(bot, guildChannel);
		if (results.fixSuccess) {
			changed = true;
		}else if (!results.permsCorrect) {
			unable.push(`<i>Unable to fix ${toChannelName(guildChannel)}</i>`);
		}
	}

	if (unable.length) {
		await sageCommand.dChannel?.send(unable.join("<br/>"));
	}

	return changed;
}
