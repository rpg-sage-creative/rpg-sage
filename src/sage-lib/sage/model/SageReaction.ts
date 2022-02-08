import type * as Discord from "discord.js";
import type { DiscordCache, DiscordKey } from "../../discord";
import { ReactionType } from "../../discord";
import type Bot from "./Bot";
import type Game from "./Game";
import SageCache from "./SageCache";
import Server from "./Server";
import User, { PatronTierType } from "./User";

type DUser = Discord.User | Discord.PartialUser;
type DMessage = Discord.Message | Discord.PartialMessage;
type DReaction = Discord.MessageReaction | Discord.PartialMessageReaction;

interface TSageReactionCore {
	cache: Map<string, any>;
	caches: SageCache;
	messageReaction: DReaction;
	user: DUser;
	reactionType: ReactionType;
};

export default class SageReaction {
	public static async fromMessageReaction(messageReaction: DReaction, user: DUser, reactionType: ReactionType): Promise<SageReaction> {
		const caches = await SageCache.fromMessageReaction(messageReaction, user);
		const cache = new Map();
		return new SageReaction({
			cache,
			caches,
			messageReaction,
			reactionType,
			user
		});
	}
	public get isAdd(): boolean {
		return this.core.reactionType === ReactionType.Add;
	}

	public get isRemove(): boolean {
		return this.core.reactionType === ReactionType.Remove;
	}

	/** Returns the message */
	public get messageReaction(): DReaction {
		return this.core.messageReaction;
	}

	public get user(): DUser {
		return this.core.user;
	}


	//TODO: look at inheriting cache class?
	private getCache<T>(key: string, fn: () => T): T {
		if (this.core.cache.has(key)) {
			return this.core.cache.get(key);
		}
		const cached = fn();
		this.core.cache.set(key, cached);
		return cached;
	}

	public constructor(private core: TSageReactionCore) {
	}

	public get message(): DMessage {
		return this.core.messageReaction.message;
	}


	// TODO: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE!
	public clone(): SageReaction {
		return new SageReaction(this.core);
	}

	//#region core

	//#region caches

	public get caches(): SageCache { return this.core.caches; }
	public get bot(): Bot { return this.caches.bot; }
	public get discord(): DiscordCache { return this.caches.discord; }
	public get discordKey(): DiscordKey { return this.caches.discordKey; }
	public get game(): Game | undefined { return this.caches.game; }
	public get server(): Server { return this.caches.server; }
	public get sageUser(): User { return this.caches.user; }

	//#endregion

	//#endregion

	public command: string | null = null;

	public canUseFeature(patronTier: PatronTierType): boolean {
		if (this.isSuperUser || this.isHomeServer) {
			return true;
		}
		return !patronTier || this.sageUser.patronTier >= patronTier;
	}

	public async getGameOrCategoryGame(): Promise<Game | null> {
		return this.game ?? this.findCategoryGame();
	}

	public async findCategoryGame(): Promise<Game | null> {
		const category = (<Discord.TextChannel>this.message.channel).parent;
		if (category) {
			const server = this.server;
			if (server) {
				// const categoryChannels = category.children.array();
				const categoryGames: Game[] = [];
				// for (const channel of categoryChannels) {
				// 	categoryGames.push(await server.getActiveGameByChannelDid(channel.id));
				// }
				// const categoryGames = await utils.ArrayUtils.Async.map(categoryChannels, channel => server.getActiveGameByChannelDid(channel.id));
				const categoryGame = categoryGames[0];
				if (categoryGame) {
					return this.caches.games.getById(categoryGame.id);
				}

			}
		}
		return null;
	}

	/** Is the server HomeServer */
	public get isHomeServer(): boolean {
		return this.getCache("isHomeServer", () => Server.isHome(this.server?.did));
	}

	/** Is the author SuperUser */
	public get isSuperUser(): boolean {
		return this.getCache("isSuperUser", () => User.isSuperUser(this.core.user.id));
	}

}
