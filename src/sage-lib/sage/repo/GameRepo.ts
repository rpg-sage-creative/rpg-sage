import type { DiscordKey } from "@rsc-utils/discord-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import type { UUID } from "@rsc-utils/core-utils";
import { Game, type GameCore } from "../model/Game.js";
import type { SageCache } from "../model/SageCache.js";
import { IdRepository } from "./base/IdRepository.js";

export class GameRepo extends IdRepository<GameCore, Game> {

	//TODO: consider historical game lookup/cleanup

	/** Cache of active channel keys */
	private channelKeyToIdMap = new Map<string, UUID>();

	/** Gets the active/current Game for the GameChannelKey */
	public async findActiveByDiscordKey(discordKey: DiscordKey): Promise<Game | undefined> {
		const games = await this.getAll();
		return games.find(game =>
			!game.isArchived
			&& game.serverDid === discordKey.server
			&& game.hasChannel(discordKey)
		);
	}
	public async findByDiscordKey(discordKey: DiscordKey): Promise<Game | undefined> {
		const games = await this.getAll();
		return games.find(game =>
			game.serverDid === discordKey.server
			&& game.hasChannel(discordKey)
		);
	}

	public async getByServerDid(serverDid: Snowflake): Promise<Game[]> {
		const allGames = await this.getAll();
		return allGames.filter(game => game.serverDid === serverDid);
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
