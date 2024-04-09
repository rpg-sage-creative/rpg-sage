import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { gSendDetails } from "./gSendDetails.js";

export async function gPruneOrphans(sageCommand: SageCommand): Promise<void> {
	const game = sageCommand.game;
	if (!game) {
		return;
	}

	const orphanUsers = await game.orphanUsers();
	const missingPlayerSnowflakes = orphanUsers.filter(user => game.hasPlayer(user.did)).map(user => user.did);
	const missingPlayers = missingPlayerSnowflakes.length > 0;

	const missingGmSnowflakes = orphanUsers.filter(user => game.hasGameMaster(user.did)).map(user => user.did);
	const missingGms = missingGmSnowflakes.length > 0;

	const orphanChannels = await game.orphanChannels();
	const missingChannelSnowflakes = orphanChannels.map(channel => channel.id);
	const missingChannels = missingChannelSnowflakes.length > 0;

	if (!missingPlayers && !missingGms && !missingChannels) {
		return;
	}

	const message = [
		missingPlayers ? `${missingPlayerSnowflakes.length} player(s) left the server.` : ``,
		missingGms ? `${missingGmSnowflakes.length} game master(s) left the server.` : ``,
		missingChannels ? `${missingChannelSnowflakes.length} channel(s) have been deleted.` : ``,
		`Remove them from the game?`
	].filter(s => s).join("\n");

	const remove = await discordPromptYesNo(sageCommand, message);
	if (!remove) {
		return;
	}

	let showAgain = false;
	const unable: string[] = [];

	if (missingPlayers) {
		const removed = await game.removePlayers(missingPlayerSnowflakes);
		if (removed) {
			showAgain = true;
		}else {
			unable.push(`<i>Unable to remove player(s)!</i>`);
		}
	}

	if (missingGms) {
		const removed = await game.removeGameMasters(missingGmSnowflakes);
		if (removed) {
			showAgain = true;
		}else {
			unable.push(`<i>Unable to remove game master(s)!</i>`);
		}
	}

	if (missingChannels) {
		const removed = await game.removeChannels(...missingChannelSnowflakes);
		if (removed) {
			showAgain = true;
		}else {
			unable.push(`<i>Unable to remove channel(s)!</i>`);
		}
	}

	if (showAgain) {
		await gSendDetails(sageCommand);
	}
	if (unable.length) {
		await sageCommand.reply(unable.join("<br/>"));
	}
}
