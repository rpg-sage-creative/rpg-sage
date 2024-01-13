import { warn } from "@rsc-utils/console-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type * as Discord from "discord.js";
import { GameType } from "../../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../sage-dice";
import utils from "../../../../sage-utils";
import { DiscordCache, DiscordId, DiscordKey } from "../../../discord";
import type Game from "../../model/Game";
import { mapSageChannelNameTags, nameTagsToType } from "../../model/Game";
import type SageCache from "../../model/SageCache";
import type SageMessage from "../../model/SageMessage";
import type Server from "../../model/Server";
import { DialogType, PermissionType, type IChannel } from "../../repo/base/IdRepository";
import { BotServerGameType, createAdminRenderableContent, registerAdminCommand } from "../cmd";
import { DicePostType } from "../dice";
import { registerAdminCommandHelp } from "../help";

//#region add

async function channelAdd(sageMessage: SageMessage): Promise<void> {
	// Don't allow this command in DMs
	const server = sageMessage.server;
	if (!server) {
		return sageMessage.reactBlock();
	}

	// Make sure we have a game
	const game = await sageMessage.getGameOrCategoryGame();
	if (!sageMessage.testGameAdmin(game)) {
		return sageMessage.reactBlock();
	}

	// Grab channels from mentions, filter out those in active games
	let channelDids = DiscordId.parseMentions(sageMessage.message).channelIds;
	channelDids = await utils.ArrayUtils.Collection.filterAsync(channelDids, async channelDid => !(await server.findActiveGameByChannelDid(channelDid)));
	if (!channelDids.length) {
		return sageMessage.reactFailure();
	}

	const channelOptions = sageMessage.args.removeAndReturnChannelOptions() || { gameMaster: PermissionType.Write };
	const channels = channelDids.map(channelDid => ({ did: channelDid, ...channelOptions }));
	const saved = await game.addOrUpdateChannels(...channels);
	return sageMessage.reactSuccessOrFailure(saved);
	// TODO: should i render the channels' details?
}

//#endregion

//#region details

async function fetchGuildChannelName(discord: DiscordCache, channelDid: Discord.Snowflake): Promise<string> {
	return discord.fetchChannelName(channelDid);
}

function channelDetailsAppendActions(renderableContent: utils.RenderUtils.RenderableContent, channel: IChannel): void {
	const allowed: string[] = [], blocked: string[] = [];
	(channel.admin ? allowed : blocked).push("Admin");
	(channel.commands ? allowed : blocked).push("Commands");
	(channel.dialog ? allowed : blocked).push("Dialog");
	(channel.dice ? allowed : blocked).push("Dice");
	(channel.search ? allowed : blocked).push("Search");
	renderableContent.append(`<b>Actions</b>`);
	renderableContent.append(`[spacer]<b>Allowed</b> ${allowed.join(", ") || "<i>none</i>"}`);
	renderableContent.append(`[spacer]<b>Blocked</b> ${blocked.join(", ") || "<i>none</i>"}`);
}

async function channelDetailsAppendAdmin(renderableContent: utils.RenderUtils.RenderableContent, server: Server, channel: IChannel): Promise<void> {
	if (channel.admin && channel.sendCommandTo) {
		renderableContent.append(`<b>Admin Options</b>`);

		const sendToName = await server.discord.fetchChannelName(channel.sendCommandTo);
		renderableContent.append(`[spacer]<b>Send Results To</b> #${sendToName} (${channel.sendCommandTo})`);
	}
}

async function channelDetailsAppendCommand(renderableContent: utils.RenderUtils.RenderableContent, server: Server, channel: IChannel): Promise<void> {
	if (channel.commands && channel.sendCommandTo) {
		renderableContent.append(`<b>Command Options</b>`);

		const sendToName = await server.discord.fetchChannelName(channel.sendCommandTo);
		renderableContent.append(`[spacer]<b>Send Results To</b> #${sendToName} (${channel.sendCommandTo})`);
	}
}

async function channelDetailsAppendDialog(renderableContent: utils.RenderUtils.RenderableContent, server: Server, game: Optional<Game>, channel: IChannel): Promise<void> {
	if (channel.dialog) {
		renderableContent.append(`<b>Dialog Options</b>`);

		const dialogType = DialogType[channel.defaultDialogType!];
		const inheritedDialogType = DialogType[game?.defaultDialogType ?? server.defaultDialogType ?? DialogType.Embed];
		renderableContent.append(`[spacer]<b>Dialog Type</b> ${dialogType ?? `<i>inherited (${inheritedDialogType})</i>`}`);

		if (channel.sendDialogTo) {
			const sendToName = await fetchGuildChannelName(server.discord, channel.sendDialogTo);
			renderableContent.append(`[spacer]<b>Send Dialog To</b> #${sendToName} (${channel.sendDialogTo})`);
		}
	}
}

async function channelDetailsAppendDice(renderableContent: utils.RenderUtils.RenderableContent, server: Server, game: Optional<Game>, channel: IChannel): Promise<void> {
	if (channel.dice) {
		renderableContent.append(`<b>Dice Options</b>`);

		if ((game ? game.gameType : server.defaultGameType) === GameType.PF2e) {
			const critMethodType = CritMethodType[channel.defaultCritMethodType!];
			const inheritedCritMethodType = CritMethodType[game?.defaultCritMethodType ?? server.defaultCritMethodType ?? CritMethodType.TimesTwo];
			renderableContent.append(`[spacer]<b>Crit Math</b> ${critMethodType ?? `<i>inherited (${inheritedCritMethodType})</i>`}`);
		}

		const diceOutputType = DiceOutputType[channel.defaultDiceOutputType!];
		const inheritedDiceOutputType = DiceOutputType[game?.defaultDiceOutputType ?? server.defaultDiceOutputType ?? DiceOutputType.M];
		renderableContent.append(`[spacer]<b>Output Format</b> ${diceOutputType ?? `<i>inherited (${inheritedDiceOutputType})</i>`}`);

		const dicePostType = DicePostType[channel.defaultDicePostType!];
		const inheritedDicePostType = DicePostType[game?.defaultDicePostType ?? server.defaultDicePostType ?? DicePostType.SinglePost];
		renderableContent.append(`[spacer]<b>Post Style</b> ${dicePostType ?? `<i>inherited (${inheritedDicePostType})</i>`}`);

		const diceSecretMethodType = DiceSecretMethodType[channel.defaultDiceSecretMethodType!];
		const inheritedDiceSecretMethodType = DiceSecretMethodType[game?.defaultDiceSecretMethodType ?? server.defaultDiceSecretMethodType ?? DiceSecretMethodType.Ignore];
		renderableContent.append(`[spacer]<b>Secret Checks</b> ${diceSecretMethodType ?? `<i>inherited (${inheritedDiceSecretMethodType})</i>`}`);

		if (channel.sendDiceTo) {
			const sendToName = await fetchGuildChannelName(server.discord, channel.sendDiceTo);
			renderableContent.append(`[spacer]<b>Send Dice To</b> #${sendToName} (${channel.sendDiceTo})`);
		}
	}
}

async function channelDetailsAppendSearch(renderableContent: utils.RenderUtils.RenderableContent, server: Server, channel: IChannel): Promise<void> {
	if (channel.search && channel.sendSearchTo) {
		renderableContent.append(`<b>Search Options</b>`);

		const sendToName = await fetchGuildChannelName(server.discord, channel.sendSearchTo);
		renderableContent.append(`[spacer]<b>Send Results To</b> #${sendToName} (${channel.sendSearchTo})`);
	}
}

function channelDetailsAppendGame(renderableContent: utils.RenderUtils.RenderableContent, server: Server, game: Optional<Game>, channel: IChannel): void {
	if (game) {
		const gameType = GameType[game.gameType!] ?? "None";
		const gameTypeText = gameType === "None" ? "" : `<i>(${gameType})</i>`;
		renderableContent.appendTitledSection(`<b>Game:</b> ${game.name} ${gameTypeText}`);

		const nameTags = mapSageChannelNameTags(channel);
		const channelType = nameTagsToType(nameTags);
		renderableContent.append(`<b>Channel Type</b> ${channelType}`);

		if (nameTags.misc) {
			renderableContent.append(`[spacer]<b>Permissions</b>`);
			renderableContent.append(`[spacer][spacer]<b>GameMaster</b> ${PermissionType[channel.gameMaster || 0]}`);
			renderableContent.append(`[spacer][spacer]<b>Player</b> ${PermissionType[channel.player || 0]}`);
			// renderableContent.append(`[spacer][spacer]<b>NonPlayer</b> ${PermissionType[channel.nonPlayer || 0]}`);
		}
	} else {
		const defaultGameType = GameType[channel.defaultGameType!];
		const inheritedGameType = GameType[server.defaultGameType ?? GameType.None];
		renderableContent.append(`<b>Default Game Type</b> ${defaultGameType ?? `<i>${inheritedGameType}</i>`}`);
	}
}

async function getChannelNameAndActiveGame(sageCache: SageCache, channelDid: Discord.Snowflake): Promise<[string, Game | undefined]> {
	const channel = await sageCache.discord.fetchChannel(channelDid);
	if (!channel || channel.type === "DM") {
		return ["DM", undefined];
	}
	const discordKey = DiscordKey.fromChannel(channel);
	return [channel.name, await sageCache.games.findActiveByDiscordKey(discordKey)];
}

export async function channelDetails(sageMessage: SageMessage, channel?: IChannel): Promise<void> {
	if (!sageMessage.canAdminServer && !sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	// Get channel from args if it isn't passed
	const channelDid = channel?.did ?? await sageMessage.args.removeAndReturnChannelDid(true);
	const [guildChannelName, game] = await getChannelNameAndActiveGame(sageMessage.caches, channelDid);
	const server = sageMessage.server;
	channel = game?.getChannel(channelDid) ?? server?.getChannel(channelDid);

	if (!channel) {
		const notProvisionedContent = createAdminRenderableContent(sageMessage.getHasColors());
		notProvisionedContent.appendTitledSection(`<b>#${guildChannelName}</b>`, `<i>Channel not provisioned!</i>`);
		return <any>sageMessage.send(notProvisionedContent);
	}

	const renderableContent = createAdminRenderableContent(server);
	renderableContent.appendTitledSection(`<b>#${guildChannelName}</b>`, `<b>Channel Id</b> ${channelDid}`);

	channelDetailsAppendGame(renderableContent, server, game, channel);
	channelDetailsAppendActions(renderableContent, channel);
	await channelDetailsAppendAdmin(renderableContent, server, channel);
	await channelDetailsAppendCommand(renderableContent, server, channel);
	await channelDetailsAppendDialog(renderableContent, server, game, channel);
	await channelDetailsAppendDice(renderableContent, server, game, channel);
	await channelDetailsAppendSearch(renderableContent, server, channel);

	return <any>sageMessage.send(renderableContent);
}

//#endregion

//#region list

async function fetchAndFilterGuildChannels(sageMessage: SageMessage, channels: IChannel[]): Promise<Discord.GuildChannel[]> {
	const guildChannels = await utils.ArrayUtils.Collection.mapAsync(channels, async channel => sageMessage.discord.fetchChannel(channel.did));
	const existing = guildChannels.filter(utils.ArrayUtils.Filters.exists) as Discord.GuildChannel[];

	const filter = sageMessage.args.join(" ").trim();
	if (filter && existing.length) {
		const lower = filter.toLowerCase();
		return existing.filter(guildChannel => guildChannel.name.toLowerCase().includes(lower));
	}
	return existing;
}

async function _channelList(sageMessage: SageMessage, whichType: BotServerGameType): Promise<void> {
	const which = whichType === BotServerGameType.Game ? sageMessage.game! : sageMessage.server;
	const guildChannels = await fetchAndFilterGuildChannels(sageMessage, which.channels);
	const renderableContent = createAdminRenderableContent(which, `<b>${BotServerGameType[whichType]} Channel List</b>`);
	if (guildChannels.length) {
		for (const guildChannel of guildChannels) {
			renderableContent.appendTitledSection(`<b>#${guildChannel.name}</b>`, `<b>Channel Id</b> ${guildChannel.id}`);
		}
	} else {
		renderableContent.append(`<blockquote>No Channels Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

async function channelListServer(sageMessage: SageMessage): Promise<void> {
	return sageMessage.canAdminServer ? _channelList(sageMessage, BotServerGameType.Server) : sageMessage.reactBlock();
}

async function channelListGame(sageMessage: SageMessage): Promise<void> {
	return sageMessage.canAdminGame ? _channelList(sageMessage, BotServerGameType.Game) : sageMessage.reactBlock();
}

async function channelList(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? channelListGame(sageMessage) : channelListServer(sageMessage);
}

//#endregion

//#region remove

async function channelRemove(sageMessage: SageMessage): Promise<void> {
	const game = await sageMessage.getGameOrCategoryGame();
	if (!sageMessage.testGameAdmin(game)) {
		return sageMessage.reactBlock();
	}

	// Grab channels from mentions and filter for the game
	const channelDids = DiscordId.parseMentions(sageMessage.message)
		.channelIds.filter(channelDid => game.hasChannel(channelDid));
	if (!channelDids.length && sageMessage.game) {
		const channelDid = await sageMessage.args.removeAndReturnChannelDid(true);
		channelDids.push(channelDid);
	}
	if (!channelDids.length) {
		return sageMessage.reactFailure();
	}

	const saved = await game.removeChannels(...channelDids);
	return sageMessage.reactSuccessOrFailure(saved);
}

//#endregion

//#region set

async function channelSet(sageMessage: SageMessage): Promise<void> {
	const targetChannelDid = await sageMessage.args.removeAndReturnChannelDid(true);
	if (!sageMessage.testChannelAdmin(targetChannelDid)) {
		return sageMessage.reactBlock();
	}

	const game = await sageMessage.getGameOrCategoryGame();
	if (game && !sageMessage.testGameAdmin(game)) {
		return sageMessage.reactBlock();
	}

	const channelOptions = sageMessage.args.removeAndReturnChannelOptions();
	if (!channelOptions) {
		warn(`No or Invalid Channel Options: ${JSON.stringify(channelOptions)}`);
		return sageMessage.reactFailure();
	}

	const hasGameOptions = channelOptions.gameMaster || channelOptions.nonPlayer || channelOptions.player;

	if (game && hasGameOptions) {
		const saved = await game.addOrUpdateChannels({ did: targetChannelDid, ...channelOptions });
		if (saved) {
			await sageMessage.server.removeChannels(targetChannelDid);
			return channelDetails(sageMessage, game.getChannel(new DiscordKey(sageMessage.server.did, targetChannelDid)));
		}
		return sageMessage.reactFailure();
	}

	const which = game ?? sageMessage.server,
		updated = await which.addOrUpdateChannels({ did: targetChannelDid, ...channelOptions });
	if (updated) {
		return channelDetails(sageMessage, which.getChannel(targetChannelDid));
	}
	return sageMessage.reactSuccessOrFailure(updated);
}

//#endregion

export default function register(): void {
	registerAdminCommand(channelAdd, "channel-add");
	registerAdminCommand(channelDetails, "channel-details");
	registerAdminCommand(channelListServer, "channel-list-server");
	registerAdminCommand(channelListGame, "channel-list-game");
	registerAdminCommand(channelList, "channel-list");
	registerAdminCommand(channelRemove, "channel-remove");
	registerAdminCommand(channelSet, "channel-set", "channel-update");

	registerAdminCommandHelp("Admin", "Channel", "channel add {#ChannelReference} {optionKey}={optionValue}");
	registerAdminCommandHelp("Admin", "Channel", "channel details");
	registerAdminCommandHelp("Admin", "Channel", "channel list");
	registerAdminCommandHelp("Admin", "Channel", "channel list {game|server}");
	registerAdminCommandHelp("Admin", "Channel", "channel remove {#ChannelReference}");
	registerAdminCommandHelp("Admin", "Channel", "channel set {optionKey}={optionValue}");
}
