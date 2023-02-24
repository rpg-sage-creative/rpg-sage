import type { GuildChannel, Snowflake } from "discord.js";
import type { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../sage-dice";
import type { Optional } from "../../../../sage-utils";
import type { RenderableContent } from "../../../../sage-utils/utils/RenderUtils";
import type { DicePostType } from "../../commands/dice";
import type SageCache from "../../model/SageCache";
import type { GameType } from "../../../../sage-common";

export type TPermissionType = keyof typeof PermissionType;
export enum PermissionType { None = 0, Read = 1, React = 2, Write = 3 }

export type TGameChannelType = keyof typeof GameChannelType;
export enum GameChannelType { None = 0, InCharacter = 1, OutOfCharacter = 2, GameMaster = 3, Miscellaneous = 4 }

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
export interface IChannelOptions extends IOldChannelOptions {
	gameChannelType?: GameChannelType;

	// Features
	admin?: boolean;
	commands?: boolean;
	dialog?: boolean;
	dice?: boolean;
	search?: boolean;

	//Defaults
	defaultDialogType?: DialogType;
	defaultCritMethodType?: CritMethodType;
	defaultDicePostType?: DicePostType;
	defaultDiceOutputType?: DiceOutputType;
	defaultDiceSecretMethodType?: DiceSecretMethodType;
	defaultGameType?: GameType;

	// Future Use
	sendCommandTo?: Snowflake;
	sendDialogTo?: Snowflake;
	sendDiceTo?: Snowflake;
	sendSearchTo?: Snowflake;
}

export interface IChannel extends IChannelOptions {
	did: Snowflake;
}

/** Any key that has a value of undefined is set; if the value is null, the key is deleted */
export function updateChannel(channel: IChannel, changes: IChannelOptions): IChannel {
	const keys = Object.keys(changes) as (keyof IChannelOptions)[];
	keys.forEach(key => {
		const value = changes[key];
		if (value === null) {
			delete channel[key];
		}else if (value !== undefined) {
			(channel as any)[key] = changes[key];
		}
	});
	return channel;
}

/** parses the channel name (for: ic, ooc, gm, misc) to get channel types */
function parseChannelTypeByName(channelName: string): GameChannelType | null {
	if (channelName.match(/\b(ic|in-char(acter)?)\b/i) !== null) {
		return GameChannelType.InCharacter;
	}
	if (channelName.match(/\b(ooc|out-of-char(acter)?)\b/i) !== null) {
		return GameChannelType.OutOfCharacter;
	}
	if (channelName.match(/\b(gm|game-?master)s?\b/i) !== null) {
		return GameChannelType.GameMaster;
	}
	if (channelName.match(/\b(misc(ellaneous)?)\b/i) !== null) {
		return GameChannelType.Miscellaneous;
	}
	return null;
}

function parseChannelTypeByChannel(channel: IChannel): GameChannelType | null {
	const commandsPerm = channel.commands === true;
	// we ignore channel.admin because it was often needed in IC channels for configuring a game
	const dialogPerm = channel.dialog === true;
	const dicePerm = channel.dice === true;
	const searchPerm = channel.search === true;

	// export enum PermissionType { None = 0, Read = 1, React = 2, Write = 3 }
	const gameMasterWrite = channel.gameMaster === PermissionType.Write;
	const playerNone = channel.player === PermissionType.None;
	const playerWrite = channel.player === PermissionType.Write;
	const nonPlayerWrite = channel.nonPlayer === PermissionType.Write;

	// GM: gm only
	if (gameMasterWrite && playerNone && !nonPlayerWrite) {
		return GameChannelType.GameMaster;
	}

	// IC: gm and player, dialog and dice, no commands/search
	if (gameMasterWrite && playerWrite && !nonPlayerWrite && dialogPerm && dicePerm && !commandsPerm && !searchPerm) {
		return GameChannelType.InCharacter;
	}

	// OOC: gm and player, dice or dialog, commands or search
	if (gameMasterWrite && playerWrite && !nonPlayerWrite && (dialogPerm || dicePerm) && (commandsPerm || searchPerm)) {
		return GameChannelType.OutOfCharacter;
	}

	// MISC: any access values set makes this a catch all
	if (channel.gameMaster || channel.player || channel.nonPlayer) {
		return GameChannelType.Miscellaneous;
	}

	return null;
}

export function parseChannelType(channelOrName?: string | IChannel): GameChannelType | null {
	switch (typeof(channelOrName)) {
		case "string": return parseChannelTypeByName(channelOrName);
		case "object": return parseChannelTypeByChannel(channelOrName);
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
