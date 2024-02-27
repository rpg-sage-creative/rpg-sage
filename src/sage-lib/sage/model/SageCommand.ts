import { Cache, HasCache } from "@rsc-utils/cache-utils";
import { debug } from "@rsc-utils/console-utils";
import type { DInteraction, DiscordKey } from "@rsc-utils/discord-utils";
import type { RenderableContentResolvable } from "@rsc-utils/render-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { If, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from "discord.js";
import type { GameType } from "../../../sage-common/index.js";
import type { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice/common.js";
import type { DiscordCache } from "../../discord/DiscordCache.js";
import { resolveToContent } from "../../discord/resolvers/resolveToContent.js";
import { resolveToEmbeds } from "../../discord/resolvers/resolveToEmbeds.js";
import type { DicePostType } from "../commands/dice.js";
import type { IChannel } from "../repo/base/IdRepository.js";
import type { Bot } from "./Bot.js";
import type { Game } from "./Game.js";
import type { GameCharacter } from "./GameCharacter.js";
import { ColorType, type IHasColorsCore } from "./HasColorsCore.js";
import type { SageCache } from "./SageCache.js";
import type { SageInteraction } from "./SageInteraction.js";
import type { SageMessage } from "./SageMessage.js";
import type { SageReaction } from "./SageReaction.js";
import type { Server } from "./Server.js";
import type { User } from "./User.js";

export interface SageCommandCore {
	sageCache: SageCache;

	isGameMaster?: boolean;
	isPlayer?: boolean;
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

export abstract class SageCommand<T extends SageCommandCore = any, U extends SageCommand<T, any> = any> extends HasCache {

	protected constructor(protected core: T, cache?: Cache | null) {
		super(cache as Cache);
	}

	public isSageInteraction<T extends DInteraction = any>(): this is SageInteraction<T> { return "interaction" in this; }
	public isSageMessage(): this is SageMessage { return "isEdit" in this; }
	public isSageReaction(): this is SageReaction { return "messageReaction" in this; }

	//#region abstract

	/** @todo: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE! */
	public abstract clone(): U;

	//#endregion

	//#region caches

	/** @deprecated use .sageCache */
	public get caches(): SageCache { return this.core.sageCache; }
	public get bot(): Bot { return this.sageCache.bot; }
	public get discord(): DiscordCache { return this.sageCache.discord; }
	public get discordKey(): DiscordKey { return this.sageCache.discordKey; }
	public get game(): Game | undefined { return this.sageCache.game; }
	public get sageCache(): SageCache { return this.core.sageCache; }
	public get sageUser(): User { return this.sageCache.user; }
	public get server(): Server { return this.sageCache.server; }

	//#endregion

	//#region channels

	/** Returns the gameChannel meta, or the serverChannel meta if no gameChannel exists. */
	public get channel(): IChannel | undefined {
		return this.cache.get("channel", () => {
			debug(`caching sageCommand.channel ${this.discordKey.channelId}`);
			return this.gameChannel ?? this.serverChannel;
		});
	}

	/** Returns the gameChannel meta for the message, checking the thread before checking its channel. */
	public get gameChannel(): IChannel | undefined {
		return this.cache.get("gameChannel", () => this.game?.getChannel(this.discordKey));
	}

	/** Returns the serverChannel meta for the message, checking the thread before checking its channel. */
	public get serverChannel(): IChannel | undefined {
		return this.cache.get("serverChannel", () => this.server?.getChannel(this.discordKey));
	}

	//#endregion

	//#region characters

	/**
	 * Gets the active player character by checking the following list:
	 * 1. Game PC for user with auto dialog in this channel
	 * 2. Game PC for user
	 * 3. Non-Game PC for user with auto dialog in this channel
	 */
	public get playerCharacter(): GameCharacter | undefined {
		return this.cache.get("playerCharacter", () => {
			const channelDid = this.channel?.did!;
			const userDid = this.sageUser.did;
			const autoChannelData = { channelDid, userDid };
			return this.game?.playerCharacters.getAutoCharacter(autoChannelData)
				?? this.game?.playerCharacters.findByUser(userDid)
				?? this.sageUser.playerCharacters.getAutoCharacter(autoChannelData)
				?? undefined;
		});
	}

	//#endregion

	//#region colors

	/** Returns the object with the correct color scheme for the current command. */
	public getHasColors(): IHasColorsCore {
		return this.game ?? this.server ?? this.bot;
	}

	// public colors = this.game?.colors ?? this.server?.colors ?? this.bot.colors;

	/** Gets the correct color by working up the "ladder" of color heirarchy. */
	public toDiscordColor(colorType: Optional<ColorType>): string | null {
		if (!colorType) {
			return null;
		}
		if (this.game) {
			return this.game.toDiscordColor(colorType);
		}
		if (this.server) {
			return this.server.toDiscordColor(colorType);
		}
		return this.bot.toDiscordColor(colorType);
	}

	// #endregion

	//#region dice settings

	public get gameType(): GameType {
		return this.cache.get("gameType", () => this.game?.gameType ?? this.serverChannel?.defaultGameType ?? this.server?.defaultGameType ?? 0);
	}

	public get critMethodType(): CritMethodType {
		return this.cache.get("critMethodType", () => this.gameChannel?.defaultCritMethodType ?? this.game?.defaultCritMethodType ?? this.serverChannel?.defaultCritMethodType ?? this.server?.defaultCritMethodType ?? 0);
	}

	public get dicePostType(): DicePostType {
		return this.cache.get("dicePostType", () => this.gameChannel?.defaultDicePostType ?? this.game?.defaultDicePostType ?? this.serverChannel?.defaultDicePostType ?? this.server?.defaultDicePostType ?? 0);
	}

	public get diceOutputType(): DiceOutputType {
		return this.cache.get("diceOutputType", () => this.gameChannel?.defaultDiceOutputType ?? this.game?.defaultDiceOutputType ?? this.serverChannel?.defaultDiceOutputType ?? this.server?.defaultDiceOutputType ?? 0);
	}

	public get diceSecretMethodType(): DiceSecretMethodType {
		return this.cache.get("diceSecretMethodType", () => this.gameChannel?.defaultDiceSecretMethodType ?? this.game?.defaultDiceSecretMethodType ?? this.serverChannel?.defaultDiceSecretMethodType ?? this.server?.defaultDiceSecretMethodType ?? 0);
	}

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

	public get isGameMaster() { return this.core.isGameMaster === true; }
	public set isGameMaster(bool: boolean) { this.core.isGameMaster = bool === true; }

	public get isPlayer() { return this.core.isPlayer === true; }
	public set isPlayer(bool: boolean) { this.core.isPlayer = bool === true; }

	//#endregion

	protected resolveToOptions(renderableOrArgs: RenderableContentResolvable | TSendArgs, ephemeral?: boolean): TSendOptions {
		if ((typeof(renderableOrArgs) === "string") || ("toRenderableContent" in renderableOrArgs)) {
			return {
				embeds: resolveToEmbeds(this.sageCache, renderableOrArgs),
				ephemeral: ephemeral
			};
		}

		const options: TSendOptions = { };
		if (renderableOrArgs.content) {
			options.content = typeof(renderableOrArgs.content) === "string"
				? renderableOrArgs.content
				: resolveToContent(this.sageCache, renderableOrArgs.content).join("\n");
		}
		if (renderableOrArgs.embeds) {
			options.embeds = Array.isArray(renderableOrArgs.embeds)
				? renderableOrArgs.embeds
				: resolveToEmbeds(this.sageCache, renderableOrArgs.embeds);
		}
		if (renderableOrArgs.components) {
			options.components = renderableOrArgs.components;
		}
		options.ephemeral = (ephemeral ?? renderableOrArgs.ephemeral) === true;
		return options;
	}
}
