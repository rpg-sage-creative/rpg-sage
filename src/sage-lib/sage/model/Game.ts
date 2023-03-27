import type { GuildMember, Message, Snowflake } from "discord.js";
import type { GameType } from "../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice";
import utils, { Args, IComparable, IdCore, Optional, OrNull, UUID } from "../../../sage-utils";
import { exists, unique } from "../../../sage-utils/utils/ArrayUtils/Filters";
import type { DGuildChannel } from "../../../sage-utils/utils/DiscordUtils";
import DiscordKey from "../../../sage-utils/utils/DiscordUtils/DiscordKey";
import { cleanJson } from "../../../sage-utils/utils/JsonUtils";
import { DicePostType } from "../commands/dice";
import { DialogType, GameChannelType, IChannel, IChannelOptions, parseGameChannelType, updateChannel } from "../repo/base/channel";
import { HasIdCoreAndSageCache } from "../repo/base/IdRepository";
import CharacterManager from "./CharacterManager";
import Colors from "./Colors";
import Emoji from "./Emoji";
import type GameCharacter from "./GameCharacter";
import type { GameCharacterCore, TGameCharacterTag } from "./GameCharacter";
import type { ColorType, CoreWithColors, HasCoreWithColors } from "./Colors";
import type { EmojiType, CoreWithEmoji, HasCoreWithEmoji } from "./Emoji";
import type SageCache from "./SageCache";
import { applyValues, getEnum, hasValues, ISageCommandArgs } from "./SageCommandArgs";
import type Server from "./Server";
import User from "./User";
import { readJsonFile } from "../../../sage-utils/utils/FsUtils";

type IChannelArgs = Args<IChannelOptions> & { did:Snowflake; };

export type TGameRoleType = keyof typeof GameRoleType;
export enum GameRoleType { Unknown = 0, Spectator = 1, Player = 2, GameMaster = 3, Table = 4, Room = 5 }

export interface IGameRole {
	did: Snowflake;
	type: GameRoleType;
	dicePing: boolean;
}

export enum GameUserType { Unknown = 0, Player = 1, GameMaster = 2 }
export interface IGameUser { did: Snowflake; type: GameUserType; dicePing: boolean; }

export type TDefaultGameOptions = {
	defaultCritMethodType: CritMethodType;
	defaultDialogType: DialogType;
	defaultDiceOutputType: DiceOutputType;
	defaultDicePostType: DicePostType;
	defaultDiceSecretMethodType: DiceSecretMethodType;
}

export function getDefaultGameOptions(args: ISageCommandArgs): Args<TDefaultGameOptions> | null {
	const opts: Args<TDefaultGameOptions> = {
		defaultCritMethodType: getEnum(args, CritMethodType, "crit", "critMethod", "critMethodType"),
		defaultDialogType: getEnum(args, DialogType, "dialogType"),
		defaultDiceOutputType: getEnum(args, DiceOutputType, "diceOutput", "diceOutputType"),
		defaultDicePostType: getEnum(args, DicePostType, "dicePost", "dicePostType"),
		defaultDiceSecretMethodType: getEnum(args, DiceSecretMethodType, "diceSecret", "diceSecretMethod", "diceSecretMethodType")
	};
	return hasValues(opts) ? opts : null;
}

export type TGameOptions = TDefaultGameOptions & {
	gameType: GameType;
	gmCharacterName: string;
	name: string;
};

/** Represents a reference to a character. */
type TGameCharacter = {
	/** If the PC is owned by a User, we need their Snowflake. */
	userDid?: string;
	charId: string;
	tags: TGameCharacterTag[];
};

export interface IGameCore extends IdCore, CoreWithColors, CoreWithEmoji, Partial<TGameOptions> {
	objectType: "Game";
	createdTs: number;
	archivedTs?: number;

	serverId: UUID;
	serverDid: Snowflake;

	channels: IChannel[];
	roles?: IGameRole[];

	characters?: TGameCharacter[];
	users?: IGameUser[];
}

export type TMappedGameChannel = {
	did: Snowflake;
	sChannel: IChannel;
	gChannel: DGuildChannel | undefined;
	gameChannelType: GameChannelType | undefined;
};

export type TFetchedGameUser = {
	dicePing: boolean;
	did: Snowflake;
	guildMember: GuildMember | undefined;
	isGM: boolean;
	isOnline: boolean;
	isPlayer: boolean;
	roleType: GameRoleType;
}

/** Returns [guildChannels.concat(sageChannels), guildChannels, sageChannels] */
async function mapChannels(channels: IChannel[], sageCache: SageCache): Promise<[TMappedGameChannel[], TMappedGameChannel[], TMappedGameChannel[]]> {
	const sChannels: TMappedGameChannel[] = [];
	const gChannels: TMappedGameChannel[] = [];
	for (const sChannel of channels) {
		sChannels.push({
			did: sChannel.did,
			sChannel: sChannel,
			gChannel: undefined,
			gameChannelType: sChannel.gameChannelType
		});

		const gChannel = await sageCache.discord.fetchChannel(sChannel.did);
		if (gChannel) {
			gChannels.push({
				did: sChannel.did,
				sChannel: sChannel,
				gChannel: gChannel,
				gameChannelType: parseGameChannelType(gChannel.name)
			});
		}
	}
	return [gChannels.concat(sChannels), gChannels, sChannels];
}

export default class Game extends HasIdCoreAndSageCache<IGameCore> implements IComparable<Game>, HasCoreWithColors, HasCoreWithEmoji {
	public constructor(core: IGameCore, public server: Server, sageCache: SageCache) {
		super(core, sageCache);
	}

	public get createdDate(): Date { return new Date(this.core.createdTs ?? 283305600000); }
	public get archivedDate(): Date | undefined { return this.core.archivedTs ? new Date(this.core.archivedTs) : undefined; }
	public get isArchived(): boolean { return this.core.createdTs && this.core.archivedTs ? this.core.createdTs < this.core.archivedTs : false; }

	public get name(): string { return this.core.name ?? ""; }
	public get gameType(): GameType | undefined { return this.core.gameType; }
	public get defaultCritMethodType(): CritMethodType | undefined { return this.core.defaultCritMethodType; }
	public get defaultDialogType(): DialogType | undefined { return this.core.defaultDialogType; }
	public get defaultDiceOutputType(): DiceOutputType | undefined { return this.core.defaultDiceOutputType; }
	public get defaultDicePostType(): DicePostType | undefined { return this.core.defaultDicePostType; }
	public get defaultDiceSecretMethodType(): DiceSecretMethodType | undefined { return this.core.defaultDiceSecretMethodType; }
	public get serverDid(): Snowflake { return this.core.serverDid; }
	public get serverId(): UUID { return this.core.serverId; }
	private get discord() { return this.sageCache.discord; }

	public get gmRole(): IGameRole | undefined { return this.roles.find(role => role.type === GameRoleType.GameMaster); }
	public get playerRole(): IGameRole | undefined { return this.roles.find(role => role.type === GameRoleType.Player); }

	public get channels(): IChannel[] { return this.core.channels ?? (this.core.channels = []); }
	public get gmCharacterName(): string { return this.core.gmCharacterName ?? this.server.defaultGmCharacterName; }
	public get roles(): IGameRole[] { return this.core.roles ?? (this.core.roles = []); }
	public get users(): IGameUser[] { return this.core.users ?? (this.core.users = []); }

	//#region characters

	private characters = new Map<string, CharacterManager>();

	private async fetchCharacters(tag: "pc" | "npc"): Promise<CharacterManager> {
		if (!this.characters.has(tag)) {
			const cores: GameCharacterCore[] = [];
			const chars = this.core.characters?.filter(char => char.tags.includes(tag)) ?? [];
			for (const char of chars) {
				const core = char.userDid
					? await User.fetchCharacter(char.userDid, char.charId)
					: await Game.fetchCharacter(this.id, char.charId);
				if (core) {
					cores.push(core);
				}
			}
			this.characters.set(tag, CharacterManager.from(cores, this, tag));
		}
		return this.characters.get(tag)!;
	}

	public async fetchPlayerCharacters(): Promise<CharacterManager> {
		return this.fetchCharacters("pc");
	}

	public async fetchNonPlayerCharacters(): Promise<CharacterManager> {
		return this.fetchCharacters("npc");
	}

	//#endregion

	//#region Guild fetches

	public async findBestPlayerChannel(): Promise<IChannel | undefined> {
		const [allChannels, gChannels, sChannels] = await mapChannels(this.channels, this.sageCache);
		return (
				allChannels.find(channel => channel.gameChannelType === GameChannelType.InCharacter)
				?? allChannels.find(channel => channel.gameChannelType === GameChannelType.OutOfCharacter)
				?? sChannels.find(channel => channel.gameChannelType !== GameChannelType.GameMaster)
				?? gChannels.find(channel => channel.gameChannelType !== GameChannelType.GameMaster)
			)?.sChannel;
	}

	public async findBestGameMasterChannel(): Promise<IChannel> {
		const [allChannels] = await mapChannels(this.channels, this.sageCache);
		return (
				allChannels.find(channel => channel.gameChannelType === GameChannelType.GameMaster)
				?? allChannels.find(channel => channel.gameChannelType === GameChannelType.InCharacter)
				?? allChannels[0]
			)?.sChannel;
	}

	private fetchedUsers: Map<number, TFetchedGameUser[]> = new Map();
	public async fetchUsers(gameRoleType?: GameRoleType, cache = true): Promise<TFetchedGameUser[]> {
		const out: TFetchedGameUser[] = [];
		const roleTypes = gameRoleType ? [gameRoleType] : [1,2,3,4,5] as GameRoleType[];
		for (const roleType of roleTypes) {
			if (!cache || !this.fetchedUsers.has(roleType)) {
				const userType = GameUserType[GameRoleType[roleType] as keyof typeof GameUserType];
				const byUser = this.users.filter(user => user.type === userType);
				const gameRole = this.roles.find(role => role.type === roleType);
				const role = await this.discord.fetchGuildRole(gameRole?.did);
				const byRole = Array.from(role?.members.values() ?? []);
				const userDids = byUser.map(user => user.did).concat(byRole.map(user => user.id)).filter(unique);
				const users = [] as TFetchedGameUser[];
				for (const did of userDids) {
					const dicePing = byUser.find(user => user.did === did)?.dicePing !== false;
					const guildMember = byRole.find(user => user.id === did) ?? await this.discord.fetchGuildMember(did) ?? undefined;
					const isOnline = ["online"].includes(guildMember?.presence?.status!);
					users.push({
						did,
						guildMember,
						isGM: roleType === GameRoleType.GameMaster,
						isOnline,
						isPlayer: roleType === GameRoleType.Player,
						dicePing,
						roleType
					});
				}
				this.fetchedUsers.set(roleType, users);
			}
			out.push(...this.fetchedUsers.get(roleType)!);
		}
		return out;
	}

	public async gmGuildChannel(): Promise<OrNull<DGuildChannel>> {
		for (const sChannel of this.channels) {
			if (sChannel.gameChannelType === GameChannelType.GameMaster) {
				const gChannel = await this.discord.fetchChannel(sChannel.did);
				if (gChannel) {
					return gChannel;
				}
			}
		}
		return null;
	}

	public async gmGuildMember(): Promise<GuildMember | null> {
		const gameMasters = await this.fetchUsers(GameRoleType.GameMaster);
		const gameMaster = gameMasters.find(gm => gm.isOnline) ?? gameMasters[0];
		return gameMaster.guildMember ?? null;
	}

	//#endregion

	// #region Channel actions

	public async addOrUpdateChannels(...channels: IChannelArgs[]): Promise<boolean> {
		channels.forEach(channel => {
			const found = this.getChannel(channel.did);
			if (found) {
				updateChannel(found, channel);
			} else {
				const cleanChannel = cleanJson({ ...channel } as IChannel, { deleteNull:true, deleteUndefined:true });
				(this.core.channels ?? (this.core.channels = [])).push(cleanChannel);
			}
		});
		return this.save();
	}

	public async removeChannels(...channelDids: Snowflake[]): Promise<boolean> {
		const count = (this.core.channels || []).length;
		if (!count) {
			return false;
		}
		channelDids.forEach(channelDid => {
			this.core.channels = this.core.channels.filter(_channel => _channel.did !== channelDid);
		});
		return this.core.channels.length !== count ? this.save() : false;
	}

	// #endregion

	// #region Role actions
	public async setRole(...roles: {type:GameRoleType;did:Snowflake|null}[]): Promise<boolean> {
		const changes = roles.map(role => {
			const existing = this.getRole(role.type);
			if (existing) {
				if (!role.did) {
					// exists, setting null
					this.core.roles = this.core.roles!.filter(role => role !== existing);
				}else {
					// exists, setting same value ... no change
					if (existing.did === role.did) return false;
					// exists, setting role
					existing.did = role.did;
				}
			}else {
				// doesn't exist, setting null ... no change
				if (!role.did) return false;
				// doesn't exist, setting role
				this.core.roles!.push({ did: role.did, type: role.type, dicePing: true });
			}
			return true;
		});
		if (changes.includes(true)) {
			return this.save();
		}
		return false;
	}
	// #endregion

	// #region GameMaster actions

	public async addGameMasters(userDids: Snowflake[]): Promise<boolean> {
		const adds = userDids.filter(userDid => !this.users.find(user => user.did === userDid));
		const players = userDids.map(userDid => this.users.find(user => user.did === userDid && user.type === GameUserType.Player)).filter(exists);
		if (!adds.length && !players.length) {
			return false;
		}
		adds.forEach(userDid => this.users.push({ type:GameUserType.GameMaster, did:userDid, dicePing:true }));
		players.forEach(user => user.type = GameUserType.GameMaster);
		return this.save();
	}

	// #endregion

	// #region Player actions

	public async addPlayers(userDids: Snowflake[]): Promise<boolean> {
		const adds = userDids.filter(userDid => !this.users.find(user => user.did === userDid));
		const gameMasters = userDids.map(userDid => this.users.find(user => user.did === userDid && user.type === GameUserType.GameMaster)).filter(exists);
		if (!adds.length && !gameMasters.length) {
			return false;
		}
		adds.forEach(userDid => this.users.push({ type:GameUserType.Player, did:userDid, dicePing:true }));
		gameMasters.forEach(user => user.type = GameUserType.Player);
		return this.save();
	}

	// #endregion

	public async removeUsers(userDids: Snowflake[]): Promise<boolean> {
		this.core.users = this.users.filter(user => !userDids.includes(user.did));
		return this.save();
	}

	public async fetchAutoCharacterForChannel(userDid: Snowflake, channelDid: Optional<Snowflake>): Promise<GameCharacter | undefined> {
		if (channelDid) {
			let char: GameCharacter | undefined;
			const isGameMaster = await this.hasUser(userDid, GameRoleType.GameMaster);
			if (isGameMaster) {
				const chars = await this.fetchNonPlayerCharacters();
				char = chars.findByName(this.gmCharacterName);
			}else {
				const chars = await this.fetchPlayerCharacters();
				char = chars.findByUser(userDid);
			}
			return char?.hasAutoChannel(channelDid) ? char : undefined;
		}
		return undefined;
	}

	public async update(opts: Args<TGameOptions>): Promise<boolean> {
		applyValues(this.core, opts);
		return this.save();
	}

	public async updateDicePing(userOrRoleDid: Snowflake, dicePing: boolean): Promise<boolean> {
		const gameUser = this.getUser(userOrRoleDid);
		if (gameUser) {
			if (gameUser.dicePing !== dicePing) {
				gameUser.dicePing = dicePing;
				return this.save();
			}
			return false;
		}
		const gameRole = this.roles.find(role => role.did === userOrRoleDid);
		if (gameRole && gameRole.dicePing !== dicePing) {
			gameRole.dicePing = dicePing;
			return this.save();
		}
		return false;
	}

	public updateGmCharacterName(gmCharacterName: string): void { this.core.gmCharacterName = gmCharacterName; }

	public async archive(): Promise<boolean> {
		this.core.archivedTs = new Date().getTime();
		return this.save();
	}

	// #region Get

	public getChannel(channelDid: Optional<Snowflake>): IChannel | undefined {
		if (channelDid) {
			return this.channels.find(channel => channel.did === channelDid);
		}
		return undefined;
	}

	public getRole(roleType: GameRoleType): IGameRole | undefined {
		return this.roles.find(role => role.type === roleType);
	}

	public getUser(userDid: Optional<Snowflake>): IGameUser | undefined {
		return this.users.find(user => user.did === userDid);
	}

	// #endregion

	// #region Has

	public hasChannel(channelDid: Optional<Snowflake>): boolean {
		return this.getChannel(channelDid) !== undefined;
	}

	/** Returns true if the game has the given User. */
	public async hasUser(userDid: Optional<Snowflake>): Promise<boolean>;
	/** Returns true if the game has the given User for the given RoleType. */
	public async hasUser(userDid: Optional<Snowflake>, roleType: GameRoleType): Promise<boolean>;
	public async hasUser(userDid: Optional<Snowflake>, roleType?: GameRoleType): Promise<boolean> {
		if (!userDid) {
			return false;
		}
		if (roleType === undefined) {
			const byUser = this.getUser(userDid) !== undefined;
			if (byUser) {
				return true;
			}
			const byRole = await hasRole(this.sageCache, userDid, ...this.roles.map(role => role.did));
			if (byRole) {
				return true;
			}
			return false;
		}
		const userType = GameUserType[GameRoleType[roleType] as keyof typeof GameUserType];
		if (userType !== undefined && this.getUser(userDid)?.type === userType) {
			return true;
		}
		const roleDid = this.getRole(roleType)?.did;
		if (roleDid) {
			return hasRole(this.sageCache, userDid, roleDid);
		}
		return false;

		async function hasRole(sageCache: SageCache, _userDid: Snowflake, ..._roleDids: Snowflake[]): Promise<boolean> {
			if (!_roleDids.length) return false;
			const guildMember = await sageCache.discord.fetchGuildMember(_userDid);
			const roleDids = Array.from(guildMember?.roles.cache.values() ?? []).map(role => role.id);
			return _roleDids.find(_roleDid => roleDids.includes(_roleDid)) !== undefined;
		}
	}

	// #endregion

	public async save(): Promise<boolean> {
		return this.sageCache.games.write(this);
	}

	// #region IComparable
	public compareTo(other: Game): -1 | 0 | 1 {
		return utils.ArrayUtils.Sort.stringIgnoreCase(this.name, other.name);
	}
	// #endregion

	// #region IHasColorsCore

	public colors = new Colors(this.core.colors ?? (this.core.colors = []));

	public toDiscordColor(colorType: ColorType): string | null {
		if (!this.core.colors.length) {
			console.warn(`Colors Missing: Game (${this.name || this.id})`);
			return this.server.toDiscordColor(colorType);
		}
		return this.colors.toDiscordColor(colorType)
			?? this.server.toDiscordColor(colorType);
	}

	// #endregion

	// #region IHasEmoji

	public emoji = new Emoji(this.core.emoji || (this.core.emoji = []));

	public emojify(text: string): string {
		return this.server.emojify(this.emoji.emojify(text));
	}

	public getEmoji(emojiType: EmojiType): string | null {
		return this.emoji.get(emojiType)
			?? this.server.getEmoji(emojiType);
	}

	// #endregion

	public static async fetchCharacter(gameId: UUID, charId: UUID): Promise<GameCharacterCore | null> {
		/** @todo sort out a variable for the path root */
		const path = `./sage/data/games/${gameId}/characters/${charId}.json`;
		return readJsonFile<GameCharacterCore>(path);
	}

	public static async from(message: Message, sageCache: SageCache): Promise<Game | null> {
		if (message.guild) {
			const game = await sageCache.games.findByDiscordKey(DiscordKey.fromMessage(message));
			if (game) {
				return game;
			}
		}
		return null;
	}
}
