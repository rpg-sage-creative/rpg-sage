import { HasCache } from "../../../sage-utils/utils/ClassUtils";
import type { DiscordCache, DiscordKey } from "../../discord";
import type Bot from "./Bot";
import type Game from "./Game";
import type SageCache from "./SageCache";
import type Server from "./Server";
import type User from "./User";

export interface HasSageCacheCore {
	caches: SageCache;
}

export default abstract class HasSageCache<T extends HasSageCacheCore, U extends HasSageCache<T, any>> extends HasCache {

	public constructor(protected core: T) {
		super();
	}

	//#region abstract

	/** TODO: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE! */
	public abstract clone(): U;

	//#endregion

	//#region caches

	public get caches(): SageCache { return this.core.caches; }
	public get bot(): Bot { return this.caches.bot; }
	public get discord(): DiscordCache { return this.caches.discord; }
	public get discordKey(): DiscordKey { return this.caches.discordKey; }
	public get game(): Game | undefined { return this.caches.game; }
	public get server(): Server { return this.caches.server; }
	public get sageUser(): User { return this.caches.user; }

	//#endregion

	//#region flags

	/** Is the server HomeServer */
	public get isHomeServer(): boolean {
		return this.server?.isHome === true;
	}

	/** Is the author SuperUser */
	public get isSuperUser(): boolean {
		return this.sageUser.isSuperUser === true;
	}

	//#endregion

	//#region games

	public async findCategoryGame(): Promise<Game | null> {
		// const category = (<Discord.TextChannel>this.message.channel).parent;
		// if (category) {
		// 	const server = this.server;
		// 	if (server) {
		// 		// const categoryChannels = category.children.array();
		// 		const categoryGames: Game[] = [];
		// 		// for (const channel of categoryChannels) {
		// 		// 	categoryGames.push(await server.getActiveGameByChannelDid(channel.id));
		// 		// }
		// 		// const categoryGames = await utils.ArrayUtils.Async.map(categoryChannels, channel => server.getActiveGameByChannelDid(channel.id));
		// 		const categoryGame = categoryGames[0];
		// 		if (categoryGame) {
		// 			return this.caches.games.getById(categoryGame.id);
		// 		}
		// 	}
		// }
		return null;
	}

	public async getGameOrCategoryGame(): Promise<Game | null> {
		return this.game ?? this.findCategoryGame();
	}

	//#endregion
}
