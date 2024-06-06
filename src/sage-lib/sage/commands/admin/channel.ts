import { DicePostType, GameSystemType, PostType, SageChannel, SageChannelType, parseGameSystem } from "@rsc-sage/types";
import { mapAsync } from "@rsc-utils/async-array-utils";
import { warn } from "@rsc-utils/core-utils";
import { DiscordKey, toChannelMention } from "@rsc-utils/discord-utils";
import { stringify } from "@rsc-utils/core-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import { isDefined, type Optional } from "@rsc-utils/core-utils";
import { GuildChannel } from "discord.js";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../sage-dice/index.js";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import type { Game } from "../../model/Game.js";
import { mapSageChannelNameTags, nameTagsToType } from "../../model/Game.js";
import type { SageCache } from "../../model/SageCache.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { Server } from "../../model/Server.js";
import { createAdminRenderableContent } from "../cmd.js";
import { BotServerGameType } from "../helpers/BotServerGameType.js";

//#region details

async function channelDetailsAppendDialog(renderableContent: RenderableContent, server: Server, game: Optional<Game>, channel: SageChannel): Promise<void> {
	if (![SageChannelType.None, SageChannelType.Dice].includes(channel.type!)) {
		renderableContent.append(`<b>Dialog Options</b>`);

		const dialogType = PostType[channel.dialogPostType!];
		const inheritedDialogType = PostType[game?.dialogPostType ?? server.dialogPostType ?? PostType.Embed];
		renderableContent.append(`[spacer]<b>Dialog Type</b> ${dialogType ?? `<i>inherited (${inheritedDialogType})</i>`}`);

		if (channel.sendDialogTo) {
			renderableContent.append(`[spacer]<b>Send Dialog To</b> ${toChannelMention(channel.sendDialogTo) ?? "<i>unknown</i>"}`);
		}
	}
}

async function channelDetailsAppendDice(renderableContent: RenderableContent, server: Server, game: Optional<Game>, channel: SageChannel): Promise<void> {
	renderableContent.append(`<b>Dice Options</b>`);

	if ((game ? game.gameSystemType : server.gameSystemType) === GameSystemType.PF2e) {
		const critMethodType = CritMethodType[channel.diceCritMethodType!];
		const inheritedCritMethodType = CritMethodType[game?.diceCritMethodType ?? server.diceCritMethodType ?? CritMethodType.TimesTwo];
		renderableContent.append(`[spacer]<b>Crit Math</b> ${critMethodType ?? `<i>inherited (${inheritedCritMethodType})</i>`}`);
	}

	const diceOutputType = DiceOutputType[channel.diceOutputType!];
	const inheritedDiceOutputType = DiceOutputType[game?.diceOutputType ?? server.diceOutputType ?? DiceOutputType.M];
	renderableContent.append(`[spacer]<b>Output Format</b> ${diceOutputType ?? `<i>inherited (${inheritedDiceOutputType})</i>`}`);

	const dicePostType = DicePostType[channel.dicePostType!];
	const inheritedDicePostType = DicePostType[game?.dicePostType ?? server.dicePostType ?? DicePostType.SinglePost];
	renderableContent.append(`[spacer]<b>Post Style</b> ${dicePostType ?? `<i>inherited (${inheritedDicePostType})</i>`}`);

	const diceSecretMethodType = DiceSecretMethodType[channel.diceSecretMethodType!];
	const inheritedDiceSecretMethodType = DiceSecretMethodType[game?.diceSecretMethodType ?? server.diceSecretMethodType ?? DiceSecretMethodType.Ignore];
	renderableContent.append(`[spacer]<b>Secret Checks</b> ${diceSecretMethodType ?? `<i>inherited (${inheritedDiceSecretMethodType})</i>`}`);

	if (channel.sendDiceTo) {
		renderableContent.append(`[spacer]<b>Send Dice To</b> ${toChannelMention(channel.sendDiceTo) ?? "<i>unknown</i>"}`);
	}
}

function channelDetailsAppendGame(renderableContent: RenderableContent, server: Server, game: Optional<Game>, channel: SageChannel): void {
	if (game) {
		const gameType = GameSystemType[game.gameSystemType!] ?? "None";
		const gameTypeText = gameType === "None" ? "" : `<i>(${gameType})</i>`;
		renderableContent.appendTitledSection(`<b>Game:</b> ${game.name} ${gameTypeText}`);

		const nameTags = mapSageChannelNameTags(channel);
		const channelType = nameTagsToType(nameTags);
		renderableContent.append(`<b>Channel Type</b> ${channelType}`);
	} else {
		const gameSystem = parseGameSystem(channel.gameSystemType);
		const inheritedGameSystem = parseGameSystem(server.gameSystemType);
		renderableContent.append(`<b>Game System</b> ${gameSystem?.name ?? `<i>${inheritedGameSystem?.name ?? "None"}</i>`}`);
	}
}

async function getChannelNameAndActiveGame(sageCache: SageCache, channelDid: Snowflake): Promise<[string, Game | undefined]> {
	const channel = await sageCache.discord.fetchChannel(channelDid);
	if (!channel || channel.type === "DM") {
		return ["DM", undefined];
	}
	const discordKey = DiscordKey.fromChannel(channel);
	return [channel.name, await sageCache.games.findActiveByDiscordKey(discordKey)];
}

export async function channelDetails(sageMessage: SageMessage, channel?: SageChannel): Promise<void> {
	if (!sageMessage.canAdminServer && !sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	// Get channel from args if it isn't passed
	const channelDid = channel?.id ?? await sageMessage.args.removeAndReturnChannelDid(true);
	const [guildChannelName, game] = await getChannelNameAndActiveGame(sageMessage.sageCache, channelDid);
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
	await channelDetailsAppendDialog(renderableContent, server, game, channel);
	await channelDetailsAppendDice(renderableContent, server, game, channel);

	return <any>sageMessage.send(renderableContent);
}

//#endregion

//#region list

async function fetchAndFilterGuildChannels(sageMessage: SageMessage, channels: SageChannel[]): Promise<GuildChannel[]> {
	const guildChannels = await mapAsync(channels, async channel => sageMessage.discord.fetchChannel(channel.id));
	const existing = guildChannels.filter(isDefined) as GuildChannel[];

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

//#region set

async function channelSet(sageMessage: SageMessage): Promise<void> {
	const id = sageMessage.threadOrChannelDid;
	if (!sageMessage.testChannelAdmin(id)) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game;
	if (game && !sageMessage.testGameAdmin(game)) {
		return sageMessage.reactBlock();
	}

	const channelOptions = sageMessage.args.getChannelOptions();
	if (!channelOptions) {
		warn(`No or Invalid Channel Options: ${stringify(channelOptions)}`);
		return sageMessage.reactFailure();
	}

	if (game) {
		const saved = await game.addOrUpdateChannels({ id, ...channelOptions } as SageChannel);
		if (saved) {
			await sageMessage.server.removeChannels(id);
			return channelDetails(sageMessage, game.getChannel(new DiscordKey(sageMessage.server.did, id)));
		}
		return sageMessage.reactFailure();
	}

	const which = game ?? sageMessage.server,
		updated = await which.addOrUpdateChannels({ id, ...channelOptions });
	if (updated) {
		return channelDetails(sageMessage, which.getChannel(id));
	}
	return sageMessage.reactSuccessOrFailure(updated);
}

//#endregion

async function channelHelp(sageCommand: SageCommand): Promise<void> {
	const isHelp = sageCommand.isCommand("channel", "help");
	await sageCommand.whisperWikiHelp(
		{ isHelp, page:"Channel-Management" },
		{ message:"If you are trying to manage a Game's Channels:", page:"Game-Management#channels" }
	);
}

export function registerChannel(): void {
	registerListeners({ commands:["channel|details"], message:channelDetails });
	registerListeners({ commands:["channel|list|server"], message:channelListServer });
	registerListeners({ commands:["channel|list|game"], message:channelListGame });
	registerListeners({ commands:["channel|list"], message:channelList });
	registerListeners({ commands:["channel|update", "channel|set"], message:channelSet });
	registerListeners({ commands:["channel", "channel|help"], handler:channelHelp });
}
