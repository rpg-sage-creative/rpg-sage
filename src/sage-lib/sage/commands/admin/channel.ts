import type * as Discord from "discord.js";
import { GameType } from "../../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../sage-dice";
import utils, { Args, Optional } from "../../../../sage-utils";
import type { DChannel } from "../../../../sage-utils/utils/DiscordUtils";
import DiscordKey from "../../../../sage-utils/utils/DiscordUtils/DiscordKey";
import type Game from "../../model/Game";
import { mapSageChannelNameTags, nameTagsToType } from "../../model/Game";
import type SageCache from "../../model/SageCache";
import { hasValues, ISageCommandArgs } from "../../model/SageCommandArgs";
import type SageMessage from "../../model/SageMessage";
import type Server from "../../model/Server";
import { getServerDefaultGameOptions } from "../../model/Server";
import { channelTypeToChannelOptions, DialogType, GameChannelType, IChannelOptions, PermissionType, type IChannel } from "../../repo/base/channel";
import { BotServerGameType, createAdminRenderableContent, registerAdminCommand } from "../cmd";
import { DicePostType } from "../dice";
import { registerAdminCommandHelp } from "../help";

//#region add

function getChannelOptions(args: ISageCommandArgs): Args<IChannelOptions> | null {
	const gameChannelType = args.getEnum<GameChannelType>(GameChannelType, "type");
	const channelTypeOptions = channelTypeToChannelOptions(gameChannelType);
	const opts: Args<IChannelOptions> = {
		...getServerDefaultGameOptions(args),
		admin: channelTypeOptions.admin ?? args.getBoolean("admin"),
		commands: channelTypeOptions.commands ?? args.getBoolean("commands"),
		dialog: channelTypeOptions.dialog ?? args.getBoolean("dialog"),
		dice: channelTypeOptions.dice ?? args.getBoolean("dice"),
		gameChannelType: gameChannelType,
		gameMaster: channelTypeOptions.gameMaster,
		nonPlayer: channelTypeOptions.nonPlayer,
		player: channelTypeOptions.player,
		search: channelTypeOptions.search ?? args.getBoolean("search"),
		sendCommandTo: args.getChannelDid("commandsto"),
		sendDialogTo: args.getChannelDid("dialogto"),
		sendDiceTo: args.getChannelDid("diceto"),
		sendSearchTo: args.getChannelDid("searchto")
	};
	return hasValues(opts) ? opts : null;
}

async function channelAdd(sageMessage: SageMessage): Promise<void> {
	// Make sure we have a game
	const game = await sageMessage.getGameOrCategoryGame();
	if (!sageMessage.checkCanAdminGame(game)) {
		return sageMessage.denyByProv("Add Game Channel", "Must be in a Game Channel to add another Game Channel");
	}

	// Grab channels from mentions, filter out those in active games
	let channelDids: Discord.Snowflake[] = sageMessage.message.mentions.channels.map(channel => channel.id);
	channelDids = await utils.ArrayUtils.Collection.filterAsync(channelDids, async channelDid => !(await game.server.findActiveGameByChannelDid(channelDid)));
	if (!channelDids.length) {
		return sageMessage.reactFailure("No Valid Channels given!");
	}

	const channelOptions = getChannelOptions(sageMessage.args) || { type:GameChannelType.Miscellaneous };
	const channels = channelDids.map(channelDid => ({ did: channelDid, ...channelOptions } as IChannel));
	const saved = await game.addOrUpdateChannels(...channels);
	return sageMessage.reactSuccessOrFailure(saved, "Game Channel Added.", "Unknown Error; Game Channel NOT Added!");
	// TODO: should i render the channels' details?
}

//#endregion

//#region details

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
			const sendToName = await server.discord.fetchChannelName(channel.sendDialogTo);
			renderableContent.append(`[spacer]<b>Send Dialog To</b> #${sendToName}`);
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
			const sendToName = await server.discord.fetchChannelName(channel.sendDiceTo);
			renderableContent.append(`[spacer]<b>Send Dice To</b> #${sendToName}`);
		}
	}
}

async function channelDetailsAppendSearch(renderableContent: utils.RenderUtils.RenderableContent, server: Server, channel: IChannel): Promise<void> {
	if (channel.search && channel.sendSearchTo) {
		renderableContent.append(`<b>Search Options</b>`);

		const sendToName = await server.discord.fetchChannelName(channel.sendSearchTo);
		renderableContent.append(`[spacer]<b>Send Results To</b> #${sendToName}`);
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
	const channel = sageCache.guild ? await sageCache.discord.fetchChannel(channelDid) as DChannel : null;
	if (!channel || channel.type === "DM") {
		return ["DM", undefined];
	}
	const discordKey = DiscordKey.fromChannel(channel);
	return [channel.name, await sageCache.games.findActiveByDiscordKey(discordKey)];
}

export async function channelDetails(sageMessage: SageMessage, channel?: IChannel): Promise<void> {
	// Get channel from args if it isn't passed
	const channelDid = channel?.did ?? sageMessage.args.getChannelDid("channel") ?? sageMessage.discordKey.channel;
	const [guildChannelName, game] = await getChannelNameAndActiveGame(sageMessage.sageCache, channelDid);

	if (game) {
		if (!sageMessage.checkCanAdminGame(game)) {
			return sageMessage.denyForCanAdminGame("Show Game Channel Details");
		}
	}else {
		if (!sageMessage.checkCanAdminServer()) {
			return sageMessage.denyForCanAdminGame("Show Server Channel Details");
		}
	}

	channel = game?.getChannel(channelDid) ?? sageMessage.server?.getChannel(channelDid);

	if (!channel) {
		const notProvisionedContent = createAdminRenderableContent(sageMessage.getHasColors());
		notProvisionedContent.appendTitledSection(`<b>#${guildChannelName}</b>`, `<i>Channel not provisioned!</i>`);
		return <any>sageMessage.send(notProvisionedContent);
	}

	const server = sageMessage.server!
	const renderableContent = createAdminRenderableContent(server);
	renderableContent.appendTitledSection(`<b>#${guildChannelName}</b>`, `<b>Channel Id</b> ${channelDid}`);

	channelDetailsAppendGame(renderableContent, server, game, channel);
	channelDetailsAppendActions(renderableContent, channel);
	await channelDetailsAppendAdmin(renderableContent, server, channel);
	await channelDetailsAppendCommand(renderableContent, server, channel);
	await channelDetailsAppendDialog(renderableContent, server, game, channel);
	await channelDetailsAppendDice(renderableContent, server, game, channel);
	await channelDetailsAppendSearch(renderableContent, server, channel);

	await sageMessage.send(renderableContent);
}

//#endregion

//#region list

async function fetchAndFilterGuildChannels(sageMessage: SageMessage, channels: IChannel[]): Promise<Discord.GuildChannel[]> {
	const guildChannels = await utils.ArrayUtils.Collection.mapAsync(channels, async channel => sageMessage.sageCache.discord.forGuild(sageMessage.server!.did).then(forGuild => forGuild?.fetchChannel(channel.did)));
	const existing = guildChannels.filter(utils.ArrayUtils.Filters.exists) as Discord.GuildChannel[];

	const filter = sageMessage.args.unkeyedValues().join(" ").trim();
	if (filter && existing.length) {
		const lower = filter.toLowerCase();
		return existing.filter(guildChannel => guildChannel.name.toLowerCase().includes(lower));
	}
	return existing;
}

async function _channelList(sageMessage: SageMessage<true>, whichType: BotServerGameType): Promise<void> {
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
	return sageMessage.checkCanAdminServer()
		? _channelList(sageMessage, BotServerGameType.Server)
		: sageMessage.denyForCanAdminServer("List Server Channels");
}

async function channelListGame(sageMessage: SageMessage): Promise<void> {
	const game = await sageMessage.getGameOrCategoryGame();
	return sageMessage.checkCanAdminGame(game)
		? _channelList(sageMessage, BotServerGameType.Game)
		: sageMessage.denyForCanAdminGame("List Game Channels");
}

async function channelList(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? channelListGame(sageMessage) : channelListServer(sageMessage);
}

//#endregion

//#region remove

async function channelRemove(sageMessage: SageMessage): Promise<void> {
	const game = await sageMessage.getGameOrCategoryGame();
	if (!sageMessage.checkCanAdminGame(game)) {
		return sageMessage.denyForCanAdminGame("Not authorized to admin this game!");
	}

	// Grab channels from mentions and filter for the game
	const channelDids: Discord.Snowflake[] = sageMessage.args.channelDids().filter(channelDid => game.hasChannel(channelDid));
	if (!channelDids.length) {
		return sageMessage.reactFailure("No valid Game channels to remove!");
	}
	if (channelDids.length === game.channels.length) {
		return sageMessage.reactFailure("Cannot remove all channels from a Game!");
	}

	const saved = await game.removeChannels(...channelDids);
	return sageMessage.reactSuccessOrFailure(saved, "Game Channel Removed.", "Unknown Error; Game Channel NOT Removed!");
}

//#endregion

//#region set

async function channelSet(sageMessage: SageMessage): Promise<void> {
	const targetChannelDid = sageMessage.args.getChannelDid("channel") ??  sageMessage.discordKey.channel;
	if (!sageMessage.testChannelAdmin(targetChannelDid)) {
		return sageMessage.denyByProv("Set Channel Options", "You must be in the channel to set or in a channel that allows commands.");
	}

	const game = await sageMessage.getGameOrCategoryGame();
	if (game && !sageMessage.checkCanAdminGame(game)) {
		return sageMessage.denyForCanAdminGame("Set Game Channel Options")
	}

	const channelOptions = getChannelOptions(sageMessage.args);
	if (!channelOptions) {
		console.warn(`No or Invalid Channel Options: ${JSON.stringify(channelOptions)}`);
		return sageMessage.reactFailure("No Channel Options found!");
	}

	// If we are adding this channel to a Game, make sure we remove the Server channel options.
	if (game && channelOptions.gameChannelType) {
		const saved = await game.addOrUpdateChannels({ did: targetChannelDid, ...channelOptions });
		if (saved) {
			await sageMessage.server.removeChannels(targetChannelDid);
			return channelDetails(sageMessage, game.getChannel(targetChannelDid));
		}
		return sageMessage.reactFailure("Unknown Error; Game Channel Options NOT Set!");
	}

	const which = game ?? sageMessage.server,
		updated = await which.addOrUpdateChannels({ did: targetChannelDid, ...channelOptions });
	if (updated) {
		return channelDetails(sageMessage, which.getChannel(targetChannelDid));
	}
	return sageMessage.reactSuccessOrFailure(updated, "Channel Options Set.", "Unknown Error; Channel Options NOT Set!");
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
