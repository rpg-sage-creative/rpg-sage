import { toHumanReadable } from "@rsc-utils/discord-utils";
import type { TextChannel } from "discord.js";
import { fixMissingChannelPerms } from "../../../../discord/permissions/fixMissingChannelPerms.js";
import { getPermsFor } from "../../../../discord/permissions/getPermsFor.js";
import { getRequiredChannelPerms } from "../../../../discord/permissions/getRequiredChannelPerms.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { Game } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";

/** Fixes Sage's perms for the game's channels. Returns true if a change was made. */
export async function gFixPerms(sageCommand: SageCommand, _game?: Game): Promise<boolean> {
	const game = _game ?? sageCommand.game;
	if (!game) {
		return false;
	}

	const bot = await sageCommand.discord.fetchGuildMember(sageCommand.bot.did);
	if (!bot) {
		return false;
	}

	const channelsMissingPerms: TextChannel[] = [];
	const gameChannels = game.channels;
	let cannotView = 0;
	for (const gameChannel of gameChannels) {
		const guildChannel = await sageCommand.sageCache.fetchChannel<TextChannel>(gameChannel.id);
		if (guildChannel) {
			const perms = getPermsFor(guildChannel, bot, ...getRequiredChannelPerms());
			if (!perms.canViewChannel) {
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
		await sageCommand.reply(`RPG Sage cannot see ${cannotView} channel(s).\nPlease have a server admin fix RPG Sage's permissions.`);
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
			unable.push(`<i>Unable to fix #${toHumanReadable(guildChannel)}</i>`);
		}
	}

	if (unable.length) {
		await sageCommand.reply(unable.join("<br/>"));
	}

	return changed;
}
