import { type UUID } from "@rsc-utils/core-utils";
import { findJsonFile } from "@rsc-utils/io-utils";
import type { MessageReference } from "discord.js";
import { Game, type GameCore } from "../model/Game.js";
import type { SageCache } from "../model/SageCache.js";
import { IdRepository } from "./base/IdRepository.js";

export class GameRepo extends IdRepository<GameCore, Game> {

	//TODO: consider historical game lookup/cleanup

	/** Cache of active channel keys */
	private channelKeyToIdMap = new Map<string, UUID>();

	/** Gets the active/current Game for the GameChannelKey */
	public async findActiveByDiscordKey(messageRef: MessageReference): Promise<Game | undefined> {
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
