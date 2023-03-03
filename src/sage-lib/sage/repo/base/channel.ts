import type { GuildChannel, Snowflake } from "discord.js";
import type { Args, Optional } from "../../../../sage-utils";
import type { RenderableContent } from "../../../../sage-utils/utils/RenderUtils";
import { mapGuildChannelNameTags, mapSageChannelNameTags } from "../../model/Game";
import type SageCache from "../../model/SageCache";
import type { TServerDefaultGameOptions } from "../../model/Server";
import { applyValues } from "../../model/SageCommandArgs";
import { cleanJson } from "../../../../sage-utils/utils/JsonUtils";

export type TPermissionType = keyof typeof PermissionType;
export enum PermissionType { None = 0, Read = 1, React = 2, Write = 3 }

export type TGameChannelType = keyof typeof GameChannelType;
export enum GameChannelType { None = 0, InCharacter = 1, OutOfCharacter = 2, GameMaster = 3, Miscellaneous = 4 }
export function parseGameChannelType(value: Optional<string>): GameChannelType | undefined {
	if (value?.match(/\b(gm|game\-?master)s?\b/i)) return GameChannelType.GameMaster;
	if (value?.match(/\b(ic|in\-?char(acter)?)\b/i)) return GameChannelType.InCharacter;
	if (value?.match(/\b(ooc|out\-?of\-?char(acter)?)\b/i)) return GameChannelType.OutOfCharacter;
	if (value?.match(/\bmisc(ellaneous)?\b/i)) return GameChannelType.Miscellaneous;
	if (value?.match(/\bnone\b/i)) return GameChannelType.None;
	return undefined;
}

export type TDialogType = keyof typeof DialogType;
export enum DialogType { Embed = 0, Post = 1 }

/** @deprecated */
export interface IOldChannelOptions {
	// Access
	/** @deprecated */
	gameMaster?: PermissionType;
	/** @deprecated */
	player?: PermissionType;
	/** @deprecated */
	nonPlayer?: PermissionType;
}

/** @todo remove "default" from these dice/game settings */
export interface IChannelOptions extends IOldChannelOptions, Partial<TServerDefaultGameOptions> {
	gameChannelType?: GameChannelType;

	// Features
	admin?: boolean;
	commands?: boolean;
	dialog?: boolean;
	dice?: boolean;
	search?: boolean;

	// Future Use
	sendCommandTo?: Snowflake;
	sendDialogTo?: Snowflake;
	sendDiceTo?: Snowflake;
	sendSearchTo?: Snowflake;
}

export interface IChannel extends IChannelOptions {
	did: Snowflake;
}

type TChannelArgs = Args<IChannelOptions> & { did:Snowflake; };

/** Any key that has a value of undefined is set; if the value is null, the key is deleted */
export function updateChannel(channel: IChannel, changes: TChannelArgs): IChannel {
	applyValues(channel, changes);
	cleanJson(channel, { deleteNull:true, deleteUndefined:true });
	return channel;
}

function parseChannelType(channelOrName?: string | IChannel): GameChannelType | null {
	switch (typeof(channelOrName)) {
		case "string": return mapGuildChannelNameTags(channelOrName).type;
		case "object": return mapSageChannelNameTags(channelOrName).type;
		default: return null;
	}
}

export function toGameChannelTypeString(gameChannelType: Optional<GameChannelType>): string | null {
	switch (gameChannelType) {
		case GameChannelType.InCharacter: return "In-Character";
		case GameChannelType.OutOfCharacter: return "Out-of-Character";
		case GameChannelType.GameMaster: return "Game Master";
		case GameChannelType.Miscellaneous: return "Miscellaneous";
		default: return null;
	}
}

export function appendChannelPermissions(renderableContent: RenderableContent, channel: IChannel, tabs = 1): void {
	const one = "".padEnd(tabs, "[spacer]");
	const two = "".padEnd(tabs + 1, "[spacer]");
	const defaultType = `<i>default (None)</i>`;
	renderableContent.append(`${one}<b>Permissions</b>`);
	renderableContent.append(`${two}<b>GameMaster</b> ${PermissionType[channel.gameMaster!] ?? defaultType}`);
	renderableContent.append(`${two}<b>Player</b> ${PermissionType[channel.player!] ?? defaultType}`);
	// renderableContent.append(`${two}<b>NonPlayer</b> ${PermissionType[channel.nonPlayer!] ?? defaultType}`);
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
	const type = channel.gameChannelType ?? parseChannelType(gChannel?.name) ?? parseChannelType(channel) ?? GameChannelType.None;
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

function trueFalseUndefined(channelType: Optional<GameChannelType>, trueList: GameChannelType[], falseList: GameChannelType[]): boolean | undefined {
	if (trueList.includes(channelType!)) {
		return true;
	}
	if (falseList.includes(channelType!)) {
		return false;
	}
	return undefined;
}

function writeNoneUndefined(channelType: Optional<GameChannelType>, writeList: GameChannelType[], noneList: GameChannelType[]): PermissionType | undefined {
	if (writeList.includes(channelType!)) {
		return PermissionType.Write;
	}
	if (noneList.includes(channelType!)) {
		return PermissionType.None;
	}
	return undefined;
}

export function channelTypeToChannelOptions(channelType: Optional<GameChannelType>): IChannelOptions {
	return {
		admin: trueFalseUndefined(channelType, [GameChannelType.InCharacter, GameChannelType.OutOfCharacter, GameChannelType.GameMaster, GameChannelType.Miscellaneous], []),
		commands: trueFalseUndefined(channelType, [GameChannelType.OutOfCharacter, GameChannelType.GameMaster, GameChannelType.Miscellaneous], [GameChannelType.InCharacter]),
		dialog: trueFalseUndefined(channelType,[GameChannelType.InCharacter, GameChannelType.OutOfCharacter, GameChannelType.GameMaster, GameChannelType.Miscellaneous], []),
		dice: trueFalseUndefined(channelType, [GameChannelType.InCharacter, GameChannelType.OutOfCharacter, GameChannelType.GameMaster, GameChannelType.Miscellaneous], []),
		search: trueFalseUndefined(channelType, [GameChannelType.OutOfCharacter, GameChannelType.GameMaster, GameChannelType.Miscellaneous], [GameChannelType.InCharacter]),

		gameMaster: writeNoneUndefined(channelType, [GameChannelType.InCharacter, GameChannelType.OutOfCharacter, GameChannelType.GameMaster, GameChannelType.Miscellaneous], []),
		nonPlayer: writeNoneUndefined(channelType, [], [GameChannelType.InCharacter, GameChannelType.OutOfCharacter, GameChannelType.GameMaster, GameChannelType.Miscellaneous]),
		player: writeNoneUndefined(channelType, [GameChannelType.InCharacter, GameChannelType.OutOfCharacter, GameChannelType.Miscellaneous], [GameChannelType.GameMaster])
	};
}
