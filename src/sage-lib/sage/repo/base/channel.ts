import type { GuildChannel, Snowflake } from "discord.js";
import type { Args, Optional } from "../../../../sage-utils";
import { exists } from "../../../../sage-utils/utils/ArrayUtils/Filters";
import { cleanJson } from "../../../../sage-utils/utils/JsonUtils";
import type SageCache from "../../model/SageCache";
import { applyValues } from "../../model/SageCommandArgs";
import type { TServerDefaultGameOptions } from "../../model/Server";

export type TPermissionType = keyof typeof PermissionType;
export enum PermissionType { None = 0, Read = 1, React = 2, Write = 3 }

export type TGameChannelType = keyof typeof GameChannelType;
export enum GameChannelType { None = 0, InCharacter = 1, OutOfCharacter = 2, GameMaster = 3, Miscellaneous = 4, Dice = 5 }
export function parseGameChannelType(value: Optional<string>): GameChannelType | undefined {
	if (value?.match(/\b(gm|game\-?master)s?\b/i)) return GameChannelType.GameMaster;
	if (value?.match(/\b(ic|in\-?char(acter)?)\b/i)) return GameChannelType.InCharacter;
	if (value?.match(/\b(ooc|out\-?of\-?char(acter)?)\b/i)) return GameChannelType.OutOfCharacter;
	if (value?.match(/\bmisc(ellaneous)?\b/i)) return GameChannelType.Miscellaneous;
	if (value?.match(/\bdice\b/i)) return GameChannelType.Dice;
	if (value?.match(/\bnone\b/i)) return GameChannelType.None;
	return undefined;
}

export type TDialogType = keyof typeof DialogType;
export enum DialogType { Embed = 0, Post = 1 }

/** @todo remove "default" from these dice/game settings */
export interface IChannelOptions extends TServerDefaultGameOptions {
	gameChannelType: GameChannelType;

	// Overrides
	commands: boolean;
	dialog: boolean;
	dice: boolean;

	// Target Channels
	sendDialogTo: Snowflake;
	sendDiceTo: Snowflake;
}

export interface IChannel extends Partial<IChannelOptions> {
	did: Snowflake;
}

type TChannelArgs = Args<IChannelOptions> & { did:Snowflake; };

/** Any key that has a value of undefined is set; if the value is null, the key is deleted */
export function updateChannel(channel: IChannel, changes: TChannelArgs): IChannel {
	applyValues(channel, changes);
	cleanJson(channel, { deleteNull:true, deleteUndefined:true });
	return channel;
}

export function toGameChannelTypeString(gameChannelType: Optional<GameChannelType>): string | null {
	switch (gameChannelType) {
		case GameChannelType.InCharacter: return "In-Character";
		case GameChannelType.OutOfCharacter: return "Out-of-Character";
		case GameChannelType.GameMaster: return "Game Master";
		case GameChannelType.Dice: return "Dice";
		case GameChannelType.Miscellaneous: return "Miscellaneous";
		default: return null;
	}
}

export type TMappedChannel = {
	did: Snowflake,
	d?: GuildChannel,
	isGM: boolean,
	isIC: boolean,
	isOOC: boolean,
	isMisc: boolean,
	name?: string,
	s: IChannel,
	type: GameChannelType
};

async function mapChannel(sageCache: SageCache, channel: IChannel): Promise<TMappedChannel> {
	const gChannel = await sageCache.discord.fetchChannel(channel.did) as GuildChannel | null;
	const type = channel.gameChannelType ?? parseGameChannelType(gChannel?.name) ?? GameChannelType.None;
	return {
		did: channel.did,
		d: gChannel ?? undefined,
		isGM: type === GameChannelType.GameMaster,
		isIC: type === GameChannelType.InCharacter,
		isOOC: type === GameChannelType.OutOfCharacter,
		isMisc: type === GameChannelType.Miscellaneous,
		name: gChannel?.name,
		s: channel,
		type
	};
}

export async function mapChannels(sageCache: SageCache, channels: IChannel[]): Promise<TMappedChannel[]> {
	const mappedChannels: TMappedChannel[] = [];
	for (const sChannel of channels) {
		mappedChannels.push(await mapChannel(sageCache, sChannel));
	}
	return mappedChannels;
}

/** @deprecated */
type THasAdminSearch = {
	/** @deprecated */
	admin: boolean;
	/** @deprecated */
	search: boolean;
}
function removeAdminSearch(channel: IChannel & Partial<THasAdminSearch>): IChannel {
	if (channel.admin || channel.search) {
		channel.commands = true;
	}

	delete channel.admin;
	delete channel.search;

	return channel;
}

/** @deprecated */
type THasGameMasterPlayerNonPlayer = {
	/** @deprecated */
	gameMaster: PermissionType;
	/** @deprecated */
	player: PermissionType;
	/** @deprecated */
	nonPlayer: PermissionType;
}

function removeGameMasterPlayerNonPlayer(channel: IChannel & Partial<THasGameMasterPlayerNonPlayer>): IChannel {
	if (!exists(channel.gameChannelType)) {
		const gameMaster = channel.gameMaster;
		const player = channel.player;
		const nonPlayer = channel.nonPlayer;

		if (exists(gameMaster) || exists(player) || exists(nonPlayer)) {
			const gmWrite = channel.gameMaster === PermissionType.Write;
			const pcWrite = channel.player === PermissionType.Write;
			const bothWrite = gmWrite && pcWrite;

			const dialog = channel.dialog === true;
			const commands = channel.commands === true;

			const gm = gmWrite && !pcWrite;
			const ooc = bothWrite && (!dialog || commands);
			const ic = bothWrite && !ooc && dialog;
			const misc = !ic && !ooc && !gm;

			let type: GameChannelType | undefined;
			if (ic) type = GameChannelType.InCharacter;
			if (gm) type = GameChannelType.GameMaster;
			if (ooc) type = GameChannelType.OutOfCharacter;
			if (misc) type = GameChannelType.Miscellaneous;
			channel.gameChannelType = type;
		}
	}

	delete channel.gameMaster;
	delete channel.player;
	delete channel.nonPlayer;

	return channel;
}

/** @deprecated */
type THasSendCommandToSendSearchTo = {
	/** @deprecated */
	sendCommandTo: string;
	/** @deprecated */
	sendSearchTo: string;
}

function removeSendCommandToSendSearchTo(channel: IChannel & Partial<THasSendCommandToSendSearchTo>): IChannel {
	delete channel.sendCommandTo;
	delete channel.sendSearchTo;

	return channel;
}

export function cleanChannelCore(channel: IChannel): IChannel {
	removeAdminSearch(channel);
	removeGameMasterPlayerNonPlayer(channel);
	removeSendCommandToSendSearchTo(channel);
	cleanJson(channel);
	return channel;
}

