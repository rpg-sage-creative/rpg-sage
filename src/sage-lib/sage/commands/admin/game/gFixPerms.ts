import { toHumanReadable } from "@rsc-utils/discord-utils";
import { TextChannel } from "discord.js";
import { fixMissingChannelPerms } from "../../../../discord/permissions/fixMissingChannelPerms.js";
import { getMissingChannelPerms } from "../../../../discord/permissions/getMissingChannelPerms.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { Game } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { gSendDetails } from "./gSendDetails.js";

export async function gFixPerms(sageCommand: SageCommand, _game?: Game): Promise<void> {
	const game = _game ?? sageCommand.game;
	if (!game) {
		return;
	}

	const bot = await sageCommand.discord.fetchGuildMember(sageCommand.bot.did);
	if (!bot) {
		return;
	}

	const channelsMissingPerms: TextChannel[] = [];
	for (const gameChannel of game.channels) {
		const guildChannel = await sageCommand.discord.fetchChannel<TextChannel>(gameChannel.id);
		if (guildChannel) {
			const missingPerms = await getMissingChannelPerms(bot, guildChannel);
			if (missingPerms.length > 0) {
				channelsMissingPerms.push(guildChannel);
			}
		}
	}

	if (!channelsMissingPerms.length) {
		return;
	}

	const message = [
		`RPG Sage is missing permissions for ${channelsMissingPerms.length} channels.`,
		`Fix RPG Sage's Permissions?`
	].join("\n");

	const fix = await discordPromptYesNo(sageCommand, message);
	if (!fix) {
		return;
	}

	let showAgain = false;
	const unable: string[] = [];
	for (const guildChannel of channelsMissingPerms) {
		const results = await fixMissingChannelPerms(bot, guildChannel);
		if (results.success) {
			showAgain = true;
		}else {
			unable.push(`<i>Unable to fix #${toHumanReadable(guildChannel)}</i>`);
		}
	}

	if (showAgain) {
		await gSendDetails(sageCommand);
	}
	if (unable.length) {
		await sageCommand.reply(unable.join("<br/>"));
	}
}
