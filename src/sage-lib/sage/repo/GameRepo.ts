import { debug, isDefined, mapAsync, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { isThread, type DInteraction, type MessageOrPartial } from "@rsc-utils/discord-utils";
import type { Channel, MessageReference } from "discord.js";
import { Game, type GameCore } from "../model/Game.js";
import type { SageCache } from "../model/SageCache.js";
import { IdRepository } from "./base/IdRepository.js";
import { globalCacheFilter, globalCacheFind, globalCacheRead, type GlobalCacheItem } from "./base/globalCache.js";

type GameCacheItem = GlobalCacheItem & { serverDid:string; archivedTs?:number; users?:{did?:string;}[]; channels?:{id:string;did?:string;}[] };

export class GameRepo extends IdRepository<GameCore, Game> {

	//TODO: consider historical game lookup/cleanup

	public async fetch({ archived, serverId, userId }: { archived?:boolean; serverId:Snowflake; userId?:Snowflake; }): Promise<Game[]> {
		const { sageCache } = this;

		const server = await sageCache.servers.getById(serverId);
		if (!server) return [];

		const contentFilter = (core: GameCacheItem) => {
			// match server first
			if (core.serverDid !== serverId) return false;
			// match archived or not
			if (!archived === !core.archivedTs) return false;
			// if we have a user, make sure they are in the game
			if (userId && !core.users?.some(user => user.did === userId)) return false;
			// we passed the tests
			return true;
		};

		const cacheItems = globalCacheFilter(this.objectTypePlural, contentFilter) as GlobalCacheItem[];
		const cores = await mapAsync(cacheItems, item => globalCacheRead(item)) as GameCore[];
		return cores.filter(isDefined).map(core => new Game(core, server, sageCache));
	}

	public async findActive(reference: Optional<Channel | DInteraction | MessageOrPartial | MessageReference>): Promise<Game | undefined> {
		if (reference) {
			if ("messageId" in reference) {
				return this.findActiveByReference(reference);
			}
			if ("isThread" in reference) {
				return this.findActiveByChannel(reference);
			}
			if (reference.channel) {
				return this.findActiveByChannel(reference.channel);
			}
		}
		return undefined;
	}

	/** Gets the active/current Game for the MessageReference */
	private async findActiveByChannel(channel: Channel): Promise<Game | undefined> {
		const guildId = "guildId" in channel ? channel.guildId ?? undefined : undefined;

		const gameByChannel = await this.findActiveByReference({
			guildId,
			channelId: channel.id
		});
		if (gameByChannel) return gameByChannel;

		if (isThread(channel)) {
			const gameByParent = await this.findActiveByReference({
				guildId,
				channelId: channel.parentId!
			});
			if (gameByParent) return gameByParent;
		}

		return undefined;
	}

	/** Gets the active/current Game for the MessageReference */
	private async findActiveByReference(messageRef: Omit<MessageReference, "messageId">): Promise<Game | undefined> {
		const { guildId, channelId } = messageRef;
		const contentFilter = (core: GameCacheItem) => !core.archivedTs
			&& core.serverDid === guildId
			&& core.channels?.some(channel => channel.id === channelId || channel.did === channelId);

		const cachedGame = this.cached.find(game => contentFilter(game.toJSON()));
		if (cachedGame) return cachedGame;

		const uncachedItem = globalCacheFind(this.objectTypePlural, contentFilter);
		const uncachedCore = uncachedItem ? await globalCacheRead(uncachedItem) : uncachedItem;
		if (uncachedCore) {
			const game = await GameRepo.fromCore(uncachedCore, this.sageCache);
			this.cacheId(game);
			return game;
		}

		return undefined;
	}

	public static async fromCore<T = GameCore, U = Game>(core: T, sageCache: SageCache): Promise<U>;
	public static async fromCore(core: GameCore, sageCache: SageCache): Promise<Game> {
		const server = await sageCache.servers.getById(core.serverId, core.serverDid);
		if (!server) debug({serverId:core.serverId,serverDid:core.serverDid});
		return new Game(core, server!, sageCache);
	}

}
