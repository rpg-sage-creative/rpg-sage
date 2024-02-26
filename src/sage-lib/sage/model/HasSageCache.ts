import { Cache, HasCache } from "@rsc-utils/cache-utils";
import type { DInteraction, DiscordKey } from "@rsc-utils/discord-utils";
import type { RenderableContentResolvable } from "@rsc-utils/render-utils";
import type { If, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from "discord.js";
import type { DiscordCache } from "../../discord";
import { resolveToEmbeds, resolveToTexts } from "../../discord/embeds";
import type { Bot } from "./Bot";
import type { Game } from "./Game";
import type { SageCache } from "./SageCache";
import type { SageInteraction } from "./SageInteraction";
import type { SageMessage } from "./SageMessage";
import type { SageReaction } from "./SageReaction";
import type { Server } from "./Server";
import type { User } from "./User";

export interface HasSageCacheCore {
	caches: SageCache;
}

export type TSendArgs<HasEphemeral extends boolean = boolean> = {
	content?: RenderableContentResolvable;
	embeds?: RenderableContentResolvable | MessageEmbed[];
	components?: MessageActionRow<MessageSelectMenu | MessageButton>[];
	ephemeral?: If<HasEphemeral, boolean | null, never>;
};

export type TSendOptions<HasEphemeral extends boolean = boolean> = {
	content?: string;
	embeds?: MessageEmbed[];
	components?: MessageActionRow<MessageSelectMenu | MessageButton>[];
	ephemeral?: If<HasEphemeral, boolean | null, never>;
};

export abstract class HasSageCache<T extends HasSageCacheCore, U extends HasSageCache<T, any>> extends HasCache {

	protected constructor(protected core: T, cache?: Cache | null) {
		super(cache as Cache);
	}

	public isSageInteraction<T extends DInteraction = any>(): this is SageInteraction<T> { return "interaction" in this; }
	public isSageMessage(): this is SageMessage { return "isEdit" in this; }
	public isSageReaction(): this is SageReaction { return "messageReaction" in this; }

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
		// 		// const categoryGames = await mapAsync(categoryChannels, channel => server.getActiveGameByChannelDid(channel.id));
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

	protected resolveToOptions(renderableOrArgs: RenderableContentResolvable | TSendArgs, ephemeral?: boolean): TSendOptions {
		if ((typeof(renderableOrArgs) === "string") || ("toRenderableContent" in renderableOrArgs)) {
			return {
				embeds: resolveToEmbeds(this.caches, renderableOrArgs),
				ephemeral: ephemeral
			};
		}

		const options: TSendOptions = { };
		if (renderableOrArgs.content) {
			options.content = typeof(renderableOrArgs.content) === "string"
				? renderableOrArgs.content
				: resolveToTexts(this.caches, renderableOrArgs.content).join("\n");
		}
		if (renderableOrArgs.embeds) {
			options.embeds = Array.isArray(renderableOrArgs.embeds)
				? renderableOrArgs.embeds
				: resolveToEmbeds(this.caches, renderableOrArgs.embeds);
		}
		if (renderableOrArgs.components) {
			options.components = renderableOrArgs.components;
		}
		options.ephemeral = (ephemeral ?? renderableOrArgs.ephemeral) === true;
		return options;
	}
}
