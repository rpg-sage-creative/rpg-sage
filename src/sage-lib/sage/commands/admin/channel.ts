import { ChannelType, Snowflake } from "discord.js";
import { GameType } from "../../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../sage-dice";
import { isDefined, type Args, type Optional } from "../../../../sage-utils";
import { filterAsync, mapAsync } from "../../../../sage-utils/ArrayUtils";
import type { DChannel, DGuildChannel } from "../../../../sage-utils/DiscordUtils";
import { DiscordKey } from "../../../../sage-utils/DiscordUtils";
import type { RenderableContent } from "../../../../sage-utils/RenderUtils";
import type { Game } from "../../model/Game";
import type { SageCache } from "../../model/SageCache";
import { hasValues, ISageCommandArgs } from "../../model/SageCommandArgs";
import type { SageMessage } from "../../model/SageMessage";
import type { Server } from "../../model/Server";
import { getServerDefaultGameOptions } from "../../model/Server";
import { DialogType, GameChannelType, IChannelOptions, type IChannel } from "../../repo/base/channel";
import { BotServerGameType, createAdminRenderableContent, registerAdminCommand } from "../cmd";
import { DicePostType } from "../dice";
import { registerAdminCommandHelp } from "../help";

//#region add

function getChannelOptions(args: ISageCommandArgs): Args<IChannelOptions> | null {
	const gameChannelType = args.getEnum(GameChannelType, "type");
	const opts: Args<IChannelOptions> = {
		...getServerDefaultGameOptions(args),
		commands: args.getBoolean("commands"),
		dialog: args.getBoolean("dialog"),
		dice: args.getBoolean("dice"),
		gameChannelType: gameChannelType,
		sendDialogTo: args.getChannelDid("dialogto"),
		sendDiceTo: args.getChannelDid("diceto")
	};
	return hasValues(opts) ? opts : null;
}

async function channelAdd(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Add Game Channel");
	if (denial) {
		return denial;
	}

	// Make sure we have a game
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.deny("Add Game Channel", "You cannot modify a Game from outside a Game.", "");
	}

	// Grab channels from mentions, filter out those in active games
	const mentionedChannelDids: Snowflake[] = sageMessage.message.mentions.channels.map(channel => channel.id);
	const usableChannelDids = await filterAsync(mentionedChannelDids, async channelDid => !(await game.server.findActiveGameByChannelDid(channelDid)));
	if (!usableChannelDids.length) {
		return sageMessage.reactFailure("No Valid Channels given!");
	}

	const channelOptions = getChannelOptions(sageMessage.args) || { type:GameChannelType.Miscellaneous };
	const channels = usableChannelDids.map(channelDid => ({ did: channelDid, ...channelOptions } as IChannel));
	const saved = await game.addOrUpdateChannels(...channels);
	return sageMessage.reactSuccessOrFailure(saved, "Game Channel Added.", "Unknown Error; Game Channel NOT Added!");
	// TODO: should i render the channels' details?
}

//#endregion

//#region details

function channelDetailsAppendActions(renderableContent: RenderableContent, channel: IChannel): void {
	const allowed: string[] = [], blocked: string[] = [];
	(channel.commands ? allowed : blocked).push("Commands");
	(channel.dialog ? allowed : blocked).push("Dialog");
	(channel.dice ? allowed : blocked).push("Dice");
	renderableContent.append(`<b>Actions</b>`);
	renderableContent.append(`[spacer]<b>Allowed</b> ${allowed.join(", ") || "<i>none</i>"}`);
	renderableContent.append(`[spacer]<b>Blocked</b> ${blocked.join(", ") || "<i>none</i>"}`);
}

async function channelDetailsAppendDialog(renderableContent: RenderableContent, server: Server, game: Optional<Game>, channel: IChannel): Promise<void> {
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

async function channelDetailsAppendDice(renderableContent: RenderableContent, server: Server, game: Optional<Game>, channel: IChannel): Promise<void> {
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

function gameChannelTypeToString(type: Optional<GameChannelType>): string {
	switch(type) {
		case GameChannelType.Dice: return "Dice";
		case GameChannelType.GameMaster: return "GM <i>(Game Master)</i>";
		case GameChannelType.InCharacter: return "IC <i>(In Character)</i>";
		case GameChannelType.Miscellaneous: return "Misc";
		case GameChannelType.None: return "None";
		case GameChannelType.OutOfCharacter: return "OOC <i>(Out of Character)</i>";
		default: return "<i>Unset</i>";
	}
}

function channelDetailsAppendGame(renderableContent: RenderableContent, server: Server, game: Optional<Game>, channel: IChannel): void {
	if (game) {
		const gameType = GameType[game.gameType!] ?? "None";
		const gameTypeText = gameType === "None" ? "" : `<i>(${gameType})</i>`;
		renderableContent.appendTitledSection(`<b>Game:</b> ${game.name} ${gameTypeText}`);

		const channelType = gameChannelTypeToString(channel.gameChannelType);
		renderableContent.append(`<b>Channel Type</b> ${channelType}`);

	} else {
		const defaultGameType = GameType[channel.defaultGameType!];
		const inheritedGameType = GameType[server.defaultGameType ?? GameType.None];
		renderableContent.append(`<b>Default Game Type</b> ${defaultGameType ?? `<i>${inheritedGameType}</i>`}`);
	}
}

async function getChannelNameAndActiveGame(sageCache: SageCache, channelDid: Snowflake): Promise<[string, Game | undefined]> {
	const channel = sageCache.guild ? await sageCache.discord.fetchChannel(channelDid) as DChannel : null;
	if (!channel || channel.type ===  ChannelType.DM) {
		return ["DM", undefined];
	}
	const discordKey = DiscordKey.fromChannel(channel);
	return [channel.name, await sageCache.games.findActiveByDiscordKey(discordKey)];
}

async function channelDetails(sageMessage: SageMessage, channel?: IChannel): Promise<void> {
	// Get channel from args if it isn't passed
	const channelDid = channel?.did ?? sageMessage.args.getChannelDid("channel") ?? sageMessage.discordKey.channel;
	const [guildChannelName, game] = await getChannelNameAndActiveGame(sageMessage.sageCache, channelDid);

	const denial = game
		? sageMessage.checkDenyAdminGame("Show Game Channel Details")
		: sageMessage.checkDenyAdminServer("Show Server Channel Details");
	if (denial) {
		return denial;
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
	await channelDetailsAppendDialog(renderableContent, server, game, channel);
	await channelDetailsAppendDice(renderableContent, server, game, channel);

	await sageMessage.send(renderableContent);
}

//#endregion

//#region list

async function fetchAndFilterGuildChannels(sageMessage: SageMessage, channels: IChannel[]): Promise<DGuildChannel[]> {
	const guildChannels = await mapAsync(channels, async channel => {
		const forGuild = await sageMessage.sageCache.discord.forGuild(sageMessage.server!.did);
		return forGuild?.fetchChannel(channel.did);
	});
	const existing = guildChannels.filter(isDefined);

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
	const denial = sageMessage.checkDenyAdminServer("List Server Channels");
	if (denial) {
		return denial;
	}
	return _channelList(sageMessage, BotServerGameType.Server);
}

async function channelListGame(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("List Game Channels");
	if (denial) {
		return denial;
	}
	return _channelList(sageMessage, BotServerGameType.Game);
}

async function channelList(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? channelListGame(sageMessage) : channelListServer(sageMessage);
}

//#endregion

//#region remove

async function channelRemove(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Remove Game Channel");
	if (denial) {
		return denial;
	}

	// Make sure we have a game
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.deny("Add Game Channel", "You cannot modify a Game from outside a Game.", "");
	}

	// Grab channels from mentions and filter for the game
	const channelDids: Snowflake[] = sageMessage.args.channelDids().filter(channelDid => game.hasChannel(channelDid));
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

async function channelSet(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Set Channel Options");
	if (denial) {
		return denial;
	}

	const targetChannelDid = sageMessage.args.getChannelDid("channel") ?? sageMessage.discordKey.channel;
	if (sageMessage.game && !sageMessage.game.hasChannel(targetChannelDid)) {
		return sageMessage.deny("Set Channel Options", "You cannot modify a non Game channel from within a Game.", "");
	}

	const channelOptions = getChannelOptions(sageMessage.args);
	if (!channelOptions) {
		console.warn(`No or Invalid Channel Options: ${JSON.stringify(channelOptions)}`);
		return sageMessage.reactFailure("No Channel Options found!");
	}

	const game = sageMessage.game;

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

export function register(): void {
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
