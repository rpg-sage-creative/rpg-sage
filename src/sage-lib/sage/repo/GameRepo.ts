import { type Optional, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { isThread, type DInteraction, type MessageOrPartial } from "@rsc-utils/discord-utils";
import { findJsonFile, readJsonFiles } from "@rsc-utils/io-utils";
import type { Channel, MessageReference } from "discord.js";
import { Game, type GameCore } from "../model/Game.js";
import type { SageCache } from "../model/SageCache.js";
import { IdRepository } from "./base/IdRepository.js";

export class GameRepo extends IdRepository<GameCore, Game> {

	//TODO: consider historical game lookup/cleanup

	/** Cache of active channel keys */
	private channelKeyToIdMap = new Map<string, UUID>();

	public async fetch({ archived, serverId, userId }: { archived?:boolean; serverId:Snowflake; userId?:Snowflake; }): Promise<Game[]> {
		const { sageCache } = this;

		const server = await sageCache.servers.getById(serverId);
		if (!server) return [];

		const contentFilter = (core: GameCore) => {
			// match server first
			if (core.serverDid !== serverId) return false;
			// match archived or not
			if (!archived === !core.archivedTs) return false;
			// if we have a user, make sure they are in the game
			if (userId && !core.users?.some(user => user.did === userId)) return false;
			// we passed the tests
			return true;
		};

		const filtered = await readJsonFiles(`${IdRepository.DataPath}/${GameRepo.objectTypePlural}`, { contentFilter });
		if (!filtered.length) return [];

		return filtered.map(core => new Game(core, server, sageCache));
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
		const contentFilter = (core: GameCore) => !core.archivedTs
			&& core.serverDid === guildId
			&& core.channels?.some(channel => channel.id === channelId || channel.did === channelId);

		const cachedGame = this.cached.find(game => contentFilter(game.toJSON()));
		if (cachedGame) return cachedGame;

		const uncachedCore = await findJsonFile(`${IdRepository.DataPath}/${this.objectTypePlural}`, { contentFilter });
		if (uncachedCore) {
			const game = await GameRepo.fromCore(uncachedCore, this.sageCache);
			this.cacheId(game.id as UUID, game);
			return game;
		}
		return undefined;
	}

	public write(game: Game): Promise<boolean> {
		this.channelKeyToIdMap.clear();
		return super.write(game);
	}

	public static async fromCore<T = GameCore, U = Game>(core: T, sageCache: SageCache): Promise<U>;
	public static async fromCore(core: GameCore, sageCache: SageCache): Promise<Game> {
		const serverId = core.serverId;
		const server = await sageCache.servers.getById(serverId);
		return new Game(core, server!, sageCache);
	}

}
