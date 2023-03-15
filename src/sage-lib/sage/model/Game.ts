import type { GuildChannel, GuildMember, Message, Role, Snowflake } from "discord.js";
import type { GameType } from "../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice";
import utils, { Args, IComparable, IdCore, Optional, OrNull, UUID } from "../../../sage-utils";
import DiscordKey from "../../../sage-utils/utils/DiscordUtils/DiscordKey";
import { cleanJson } from "../../../sage-utils/utils/JsonUtils";
import { DicePostType } from "../commands/dice";
import { cleanChannelCore, DialogType, GameChannelType, IChannel, IChannelOptions, parseGameChannelType, updateChannel } from "../repo/base/channel";
import { HasIdCoreAndSageCache } from "../repo/base/IdRepository";
import CharacterManager from "./CharacterManager";
import Colors from "./Colors";
import Emoji from "./Emoji";
import type GameCharacter from "./GameCharacter";
import type { GameCharacterCore } from "./GameCharacter";
import type { ColorType, IHasColors, IHasColorsCore } from "./HasColorsCore";
import type { EmojiType, IHasEmoji, IHasEmojiCore } from "./HasEmojiCore";
import type SageCache from "./SageCache";
import { applyValues, getEnum, hasValues, ISageCommandArgs } from "./SageCommandArgs";
import type Server from "./Server";

const exists = utils.ArrayUtils.Filters.exists;

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

export interface IGameCore extends IdCore, IHasColors, IHasEmoji, Partial<TGameOptions> {
	objectType: "Game";
	createdTs: number;
	archivedTs?: number;

	serverId: UUID;
	serverDid: Snowflake;

	channels: IChannel[];
	roles?: IGameRole[];

	users?: IGameUser[];

	nonPlayerCharacters?: (GameCharacter | GameCharacterCore)[];
	playerCharacters?: (GameCharacter | GameCharacterCore)[];
}

export type TMappedGameChannel = {
	did: Snowflake;
	sChannel: IChannel;
	gChannel: GuildChannel | undefined;
	gameChannelType: GameChannelType | undefined;
};

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

		const gChannel = await sageCache.discord.fetchChannel(sChannel.did) as GuildChannel;
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

export default class Game extends HasIdCoreAndSageCache<IGameCore> implements IComparable<Game>, IHasColorsCore, IHasEmojiCore {
	public constructor(core: IGameCore, public server: Server, sageCache: SageCache) {
		super(core, sageCache);

		this.channels.forEach(cleanChannelCore);

		this.core.nonPlayerCharacters = CharacterManager.from(this.core.nonPlayerCharacters as GameCharacterCore[] ?? [], this, "npc");
		this.core.playerCharacters = CharacterManager.from(this.core.playerCharacters as GameCharacterCore[] ?? [], this, "pc");
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
	public get gmRoleDid(): Snowflake | undefined { return this.gmRole?.did; }

	public get playerRole(): IGameRole | undefined { return this.roles.find(role => role.type === GameRoleType.Player); }
	public get playerRoleDid(): Snowflake | undefined { return this.playerRole?.did; }
	public get players(): Snowflake[] { return this.users.filter(user => user.type === GameUserType.Player).map(user => user.did); }

	public get channels(): IChannel[] { return this.core.channels ?? (this.core.channels = []); }
	public get gameMasters(): Snowflake[] { return this.users.filter(user => user.type === GameUserType.GameMaster).map(user => user.did); }
	public get gmCharacterName(): string { return this.core.gmCharacterName ?? this.server.defaultGmCharacterName; }
	public get nonPlayerCharacters(): CharacterManager { return this.core.nonPlayerCharacters as CharacterManager; }
	public get playerCharacters(): CharacterManager { return this.core.playerCharacters as CharacterManager; }
	public get orphanedPlayerCharacters() { return this.playerCharacters.filter(pc => !pc.userDid || !this.players.includes(pc.userDid)); }
	public get roles(): IGameRole[] { return this.core.roles ?? (this.core.roles = []); }
	public get users(): IGameUser[] { return this.core.users ?? (this.core.users = []); }

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
	public async gmGuildChannel(): Promise<OrNull<GuildChannel>> {
		for (const sChannel of this.channels) {
			if (sChannel.gameChannelType === GameChannelType.GameMaster) {
				const gChannel = await this.discord.fetchChannel(sChannel.did);
				if (gChannel) {
					return gChannel as GuildChannel;
				}
			}
		}
		return null;
	}
	public async pGuildMembers(): Promise<GuildMember[]> {
		// TODO: investiage iterating over guild.memebers as "cleaner"
		// return Promise.all(this.players.map(player => this.discord.fetchGuildMember(player)));

		const pGuildMembers = (await Promise.all(this.players.map(player => this.discord.fetchGuildMember(player))))
			.filter(exists);
		const pRoleDid = this.playerRoleDid;
		if (pRoleDid) {
			const discordRole = await this.discord.fetchGuildRole(pRoleDid);
			if (discordRole) {
				const roleOnly = discordRole.members.filter(guildMember => !pGuildMembers.find(p => p.id === guildMember.id));
				pGuildMembers.push(...roleOnly.values());
			}
		}
		return pGuildMembers;
	}
	public async guildChannels(): Promise<GuildChannel[]> {
		const all = await Promise.all(this.channels.map(channel => this.discord.fetchChannel(channel.did)));
		return all.filter(exists) as GuildChannel[];
	}
	public async orphanChannels(): Promise<IChannel[]> {
		const all = await Promise.all(this.channels.map(channel => this.discord.fetchChannel(channel.did)));
		return this.channels.filter((_, index) => !all[index]);
	}
	public async orphanUsers(): Promise<IGameUser[]> {
		const all = await Promise.all(this.users.map(user => this.discord.fetchUser(user.did)));
		return this.users.filter((_, index) => !all[index]);
	}
	public async gmGuildMembers(): Promise<GuildMember[]> {
		const gmGuildMembers = (await Promise.all(this.gameMasters.map(gameMaster => this.discord.fetchGuildMember(gameMaster)))).filter(exists);
		const gmRoleDid = this.gmRoleDid;
		if (gmRoleDid) {
			const discordRole = await this.discord.fetchGuildRole(gmRoleDid);
			if (discordRole) {
				const roleOnly = discordRole.members.filter(guildMember => !gmGuildMembers.find(gm => gm.id === guildMember.id));
				gmGuildMembers.push(...roleOnly.values());
			}
		}
		return gmGuildMembers;
	}
	public async gmGuildMember(): Promise<GuildMember | null> {
		return this.discord.fetchGuildMember(this.gameMasters[0]);
		//TODO: LEARN HOW TO CHECK ONLINE STATUS
		// let first: GuildMember;
		// for (const gameMaster of this.gameMasters) {
		// 	const guildMember = await this.discord.fetchGuildMember(gameMaster);
		// 	const user = guildMember?.user;
		// 	if (["online"].includes(user?.presence?.status)) {
		// 		return guildMember;
		// 	}
		// 	first = first || guildMember;
		// }
		// return first || null;
	}
	public async guildRoles(): Promise<Role[]> {
		return (await Promise.all(this.roles.map(role => this.discord.fetchGuildRole(role.did)))).filter(exists);
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
		const filtered: Snowflake[] = [];
		for (const userDid of userDids) {
			const user = this.getUser(userDid);
			if (user) {
				if (user.type !== GameUserType.GameMaster) {
					await this.removePlayers([userDid]);
					filtered.push(userDid);
				}
			} else {
				filtered.push(userDid);
			}
		}
		if (!filtered.length) {
			return false;
		}

		const gameMasters = userDids.map(userDid => (<IGameUser>{ did: userDid, type: GameUserType.GameMaster }));
		this.users.push(...gameMasters);
		return this.save();
	}
	public async removeGameMasters(userDids: Snowflake[]): Promise<boolean> {
		const filtered = userDids.filter(userDid => this.hasGameMaster(userDid));
		if (!filtered.length) {
			return false;
		}

		const nonPlayerCharacters = this.nonPlayerCharacters;
		filtered.map(userDid => nonPlayerCharacters.filter(npc => npc.userDid === userDid)).forEach(npcs => npcs.forEach(npc => delete npc.userDid));

		this.core.users = this.users.filter(user => user.type !== GameUserType.GameMaster || !filtered.includes(user.did));
		return this.save();
	}
	// #endregion GameMaster actions

	// #region Player actions
	public async addPlayers(userDids: Snowflake[]): Promise<boolean> {
		const filtered: Snowflake[] = [];
		for (const userDid of userDids) {
			const user = this.getUser(userDid);
			if (user) {
				if (user.type !== GameUserType.Player) {
					await this.removeGameMasters([userDid]);
					filtered.push(userDid);
				}
			} else {
				filtered.push(userDid);
			}
		}
		if (!filtered.length) {
			return false;
		}

		const players = userDids.map(userDid => (<IGameUser>{ did: userDid, type: GameUserType.Player }));
		this.users.push(...players);
		return this.save();
	}
	public async removePlayers(userDids: Snowflake[]): Promise<boolean> {
		const filtered = userDids.filter(userDid => this.hasPlayer(userDid));
		if (!filtered.length) {
			return false;
		}

		const playerCharacters = this.playerCharacters;
		filtered.map(userDid => playerCharacters.filter(pc => pc.userDid === userDid)).forEach(pcs => pcs.forEach(pc => delete pc.userDid));

		this.core.users = this.users.filter(user => user.type !== GameUserType.Player || !filtered.includes(user.did));
		return this.save();
	}
	// #endregion PC actions

	public getAutoCharacterForChannel(userDid: Snowflake, channelDid: Optional<Snowflake>): GameCharacter | undefined {
		if (channelDid) {
			const char = this.hasGameMaster(userDid)
				? this.nonPlayerCharacters.findByName(this.gmCharacterName)
				: this.playerCharacters.findByUser(userDid);
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

	public getPlayer(userDid: Optional<Snowflake>): IGameUser | undefined {
		return this.users.find(user => user.did === userDid && user.type === GameUserType.Player);
	}

	// #endregion

	// #region Has

	public hasChannel(channelDid: Optional<Snowflake>): boolean {
		return this.getChannel(channelDid) !== undefined;
	}

	public hasGameMaster(userDid: Optional<Snowflake>): boolean {
		return this.getUser(userDid)?.type === GameUserType.GameMaster;
	}

	public hasPlayer(userDid: Optional<Snowflake>): boolean {
		return this.getUser(userDid)?.type === GameUserType.Player;
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
			if (this.getUser(userDid) !== undefined) {
				return true;
			}
			for (const role of this.roles) {
				const bool = await hasRole(this.sageCache, userDid, role.did);
				if (bool) {
					return true;
				}
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

		async function hasRole(sageCache: SageCache, _userDid: Snowflake, _roleDid: Snowflake): Promise<boolean> {
			const guildMember = await sageCache.discord.fetchGuildMember(_userDid);
			const roleDids = Array.from(guildMember?.roles.cache.values() ?? []).map(role => role.id);
			return roleDids.includes(_roleDid);
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
