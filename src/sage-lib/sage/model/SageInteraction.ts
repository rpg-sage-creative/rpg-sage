import type * as Discord from "discord.js";
import { SuperClass } from "../../../sage-utils/utils/ClassUtils";
import { DInteraction, DiscordCache, DiscordKey, DUser, InteractionType, TRenderableContentResolvable } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import type Bot from "./Bot";
import type Game from "./Game";
import SageCache from "./SageCache";
import Server from "./Server";
import User, { PatronTierType } from "./User";

interface TSageInteractionCore {
	cache: Map<string, any>;
	caches: SageCache;
	interaction: DInteraction;
	type: InteractionType;
}

export default class SageInteraction extends SuperClass {
	public static async fromInteraction(interaction: DInteraction): Promise<SageInteraction> {
		const caches = await SageCache.fromInteraction(interaction);
		const cache = new Map();
		const type = InteractionType.Unknown;
		return new SageInteraction({
			cache,
			caches,
			interaction,
			type
		});
	}

	public get isCommand(): boolean {
		return this.interaction.isCommand();
	}

	/** Returns the message */
	public get interaction(): DInteraction {
		return this.core.interaction;
	}

	public get user(): DUser {
		return this.core.interaction.user;
	}

	public constructor(private core: TSageInteractionCore) {
		super();
	}


	// TODO: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE!
	public clone(): SageInteraction {
		return new SageInteraction(this.core);
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
		const category = (<Discord.TextChannel>this.interaction.channel).parent;
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
		return this.cache.get("isHomeServer", () => Server.isHome(this.server?.did));
	}

	/** Is the author SuperUser */
	public get isSuperUser(): boolean {
		return this.cache.get("isSuperUser", () => User.isSuperUser(this.core.interaction.user.id));
	}

	public async reply(renderable: TRenderableContentResolvable, ephemeral?: boolean): Promise<void> {
		const embeds = resolveToEmbeds(this.caches, renderable);
		return this.interaction.reply({ embeds:embeds, ephemeral:ephemeral ?? true });
	}

}
