import type { DiscordKey } from "@rsc-utils/discord-utils";
import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { UUID } from "@rsc-utils/uuid-utils";
import { Game, type IGameCore } from "../model/Game";
import type { SageCache } from "../model/SageCache";
import { IdRepository } from "./base/IdRepository";

export class GameRepo extends IdRepository<IGameCore, Game> {

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

	public static async fromCore<T = IGameCore, U = Game>(core: T, sageCache: SageCache): Promise<U> {
		return <U><unknown>new Game(<IGameCore><unknown>core, (await sageCache.servers.getById((<IGameCore><unknown>core).serverId))!, sageCache);
	}

}
