import type { Cache } from "@rsc-utils/cache-utils";
import { debug, isDefined, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordKey, type DInteraction, type MessageTarget } from "@rsc-utils/discord-utils";
import { RenderableContent, type RenderableContentResolvable } from "@rsc-utils/render-utils";
import { isString } from "@rsc-utils/string-utils";
import type { InteractionReplyOptions, InteractionUpdateOptions, Message, User } from "discord.js";
import type { SlashCommandGameType } from "../../../app-commands/types.js";
import { deleteMessages } from "../../discord/deletedMessages.js";
import { InteractionType } from "../../discord/index.js";
import { send } from "../../discord/messages.js";
import type { IChannel } from "../repo/base/IdRepository.js";
import { GameRoleType } from "./Game.js";
import type { GameCharacter } from "./GameCharacter.js";
import { SageCache } from "./SageCache.js";
import { SageCommand, type SageCommandCore, type TSendArgs } from "./SageCommand.js";
import { SageInteractionArgs } from "./SageInteractionArgs.js";
import type { HasChannels, HasGame } from "./index.js";

interface SageInteractionCore extends SageCommandCore {
	interaction: DInteraction;
	type: InteractionType;
}

/** Parses a string of type `{indicator}|{userId}|{action}|...` */
type IdParts = {
	/** Generally the tool or feature of Sage */
	indicator: string;
	/** Generally the user doing the action. */
	userId: Snowflake;
	/** The action being performed. */
	action: string;
	/** any remaining values */
	args?: string[];
};

type CustomIdParser<T extends IdParts> = (customId: string) => T | undefined;

function defaultCustomIdParser<T extends IdParts>(customId: string): T | undefined {
	const args = customId.split("|");
	const indicator = args.shift();
	const userId = args.shift() as Snowflake;
	const action = args.shift();
	return indicator && userId && action
		? { args, indicator, userId, action} as T
		: undefined;
}

export class SageInteraction<T extends DInteraction = any>
	extends SageCommand<SageInteractionCore, SageInteractionArgs>
	implements HasGame, HasChannels {

	private constructor(protected core: SageInteractionCore, cache?: Cache) {
		super(core, cache);
		this.args = new SageInteractionArgs(this);
	}

	public async fetchMessage(messageId?: Snowflake): Promise<Message | undefined> {
		if (messageId) {
			let channel = this.interaction.channel;
			if (channel?.partial) {
				channel = await channel.fetch();
			}
			return channel?.messages.fetch(messageId);
		}

		let message: Message | undefined;
		if (this.isSageInteraction("MESSAGE")) {
			message = this.interaction.message;
		}
		if (this.isSageInteraction("MSG_CONTEXT")) {
			message = this.interaction.targetMessage;
		}
		if (message?.partial) {
			return message.fetch();
		}
		return message;
	}

	//#region HasSageCache

	public args: SageInteractionArgs;

	/** @todo: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE! */
	public clone(): this {
		return new SageInteraction(this.core, this.cache) as this;
	}

	/** @todo should this be destroy and call super.destroy() ? */
	public clear(): void {
		debug("Clearing SageInteraction");
		this.args.clear();
		this.cache.clear();
		this.sageCache.clear();
	}

	//#endregion

	//#region command / category / sub

	/** Splits the command on | and calls isCommand with the correct number of args. */
	public commandMatches(command: string): boolean {
		const [one, two] = command.split("|");
		if (two) return this.isCommand(one, two);
		return this.isCommand(one);
	}

	public isCommand(command: string): boolean;
	public isCommand(sub: string, command: string): boolean;
	public isCommand(gameType: SlashCommandGameType, command: string): boolean;
	public isCommand(...args: string[]): boolean {
		if (!this.interaction.isCommand() && !this.interaction.isContextMenuCommand()) {
			return false;
		}

		const command = args.pop()!;
		const commandLower = command.toLowerCase();

		const subCommand = args[0] as SlashCommandGameType;
		const subCommandLower = subCommand?.toLowerCase();

		const commandValues = this.commandValues.map(s => s.toLowerCase());
		if (["sage", "sage-stable", "sage-beta", "sage-dev"].includes(commandValues[0])) {
			commandValues.shift();
		}
		if (commandValues[0]?.startsWith("sage-")) {
			commandValues[0] = commandValues[0].replace(/^sage-(dev-|beta-)?/i, "");
		}

		if (commandValues.length === 2 || subCommandLower) {
			return commandValues[0] === subCommandLower
				&& commandValues[1] === commandLower;
		}

		return commandValues[0] === commandLower;
	}

	public get commandValues(): string[] {
		if (this.interaction.isChatInputCommand()) {
			return [
				this.interaction.commandName,
				this.interaction.options.getSubcommandGroup(false),
				this.interaction.options.getSubcommand(false)
			].filter(isDefined);
		}
		if (this.interaction.isContextMenuCommand()) {
			return [
				this.interaction.commandName
			];
		}
		return [];
	}

	//#endregion

	//#region customId

	public customIdMatches(valueOrRegex: string | RegExp): boolean {
		if ("customId" in this.interaction) {
			const customId = this.interaction.customId;
			return isString(valueOrRegex)
				? customId === valueOrRegex
				: valueOrRegex.test(customId);
		}
		return false;
	}

	public parseCustomId<T extends IdParts>(parser?: CustomIdParser<T>): T | undefined {
		if ("customId" in this.interaction) {
			return (parser ?? defaultCustomIdParser)(this.interaction.customId);
		}
		return undefined;
	}

	//#endregion

	/** Returns the interaction */
	public get interaction(): T {
		return this.core.interaction as T;
	}

	/** Returns the user */
	public get user(): User {
		return this.core.interaction.user;
	}

	//#region defer/reply

	/** Flag toggled when followUp() is called. */
	private updates: Message<boolean>[] = [];

	/** Deletes the reply and any updates (ONLY IF NOT EPHEMERAL) */
	public async deleteReply(): Promise<void> {
		if (!this.isSageInteraction("REPLIABLE")) return; // NOSONAR

		if (this.updates.length) {
			await deleteMessages(this.updates);
			this.updates.length = 0;
		}
		await this.interaction.deleteReply();
	}

	/** Uses reply() if not replied to yet or editReply() to edit the previous reply. */
	public async reply(args: TSendArgs): Promise<void>;
	public async reply(renderable: RenderableContentResolvable, ephemeral: boolean): Promise<void>;
	public async reply(renderableOrArgs: RenderableContentResolvable | TSendArgs, ephemeral?: boolean): Promise<void> {
		if (!this.isSageInteraction("REPLIABLE")) return; // NOSONAR

		const args = this.resolveToOptions(renderableOrArgs, ephemeral);
		if (this.interaction.deferred || this.interaction.replied) {
			/** @todo confirm that we need to do the followup step here */
			// if (ephemeral || this.interaction.ephemeral) {
				const message = await this.interaction.followUp(args as InteractionReplyOptions) as Message<boolean>;
				this.updates.push(message);
			// }else {
			// 	await this.interaction.editReply(args) as any;
			// }

		}else if ("update" in this.interaction) {
			await this.interaction.update(args as InteractionUpdateOptions);

		}else if ("reply" in this.interaction) {
			await this.interaction.reply(args as InteractionReplyOptions);
		}
	}

	/** Sends a full message to the channel or user the interaction originated in. */
	public send(renderableContentResolvable: RenderableContentResolvable): Promise<Message[]>;
	public send(renderableContentResolvable: RenderableContentResolvable, targetChannel: MessageTarget): Promise<Message[]>;
	public send(renderableContentResolvable: RenderableContentResolvable, targetChannel: MessageTarget, originalAuthor: User): Promise<Message[]>;
	public async send(renderableContentResolvable: RenderableContentResolvable, targetChannel = this.interaction.channel as MessageTarget, originalAuthor = this.interaction.user): Promise<Message[]> {
		const canSend = await this.canSend(targetChannel);
		if (!canSend) {
			return [];
		}
		// check to see if we have channel send message permissions
		const renderableContent = RenderableContent.resolve(renderableContentResolvable);
		if (renderableContent) {
			return send(this.sageCache, targetChannel, renderableContent, originalAuthor);
		}
		return [];
	}
	public async canSend(targetChannel = this.interaction.channel as MessageTarget): Promise<boolean> {
		return this.sageCache.canSendMessageTo(DiscordKey.from(targetChannel));
	}

	public async whisper(args: TSendArgs): Promise<void>;
	public async whisper(content: string): Promise<void>;
	public async whisper(contentOrArgs: string | TSendArgs): Promise<void> {
		const args = isString(contentOrArgs) ? { content:contentOrArgs } : { ...contentOrArgs };
		args.ephemeral = false;
		// args.ephemeral = !!this.sageCache.server;
		return this.reply(args);
	}

	//#endregion

	// #region HasChannels

	/** Returns the gameChannel meta, or the serverChannel meta if no gameChannel exists. */
	public get channel(): IChannel | undefined {
		return this.cache.getOrSet("channel", () => this.gameChannel ?? this.serverChannel);
	}

	/** Returns the channelDid this message (or its thread) is in. */
	public get channelDid(): Snowflake | undefined {
		return this.cache.getOrSet("channelDid", () => {
			if (this.interaction.channel?.isThread()) {
				return this.interaction.channel.parentId as Snowflake ?? undefined;
			}
			return this.interaction.channelId as Snowflake ?? undefined;
		});
	}

	/** Returns the gameChannel meta for the message, checking the thread before checking its channel. */
	public get gameChannel(): IChannel | undefined {
		return this.cache.getOrSet("gameChannel", () => this.game?.getChannel(this.discordKey));
	}

	/** Returns the serverChannel meta for the message, checking the thread before checking its channel. */
	public get serverChannel(): IChannel | undefined {
		return this.cache.getOrSet("serverChannel", () => this.server?.getChannel(this.discordKey));
	}

	/** Returns the threadDid this message is in. */
	public get threadDid(): Snowflake | undefined {
		return this.cache.getOrSet("threadDid", () => {
			if (this.interaction.channel?.isThread()) {
				return this.interaction.channelId as Snowflake ?? undefined;
			}
			return undefined;
		});
	}

	/** Returns either the message's threadDid or channelDid if there is no thread. */
	public get threadOrChannelDid(): Snowflake {
		return this.cache.getOrSet("channelDid", () => this.threadDid ?? this.channelDid ?? this.interaction.channelId as Snowflake);
	}

	// #endregion

	//#region HasGame

	/** Get the PlayerCharacter if there a game and the actor has a PlayerCharacter OR the actor has a PlayerCharacter set to use this channel with AutoChannel */
	public get playerCharacter(): GameCharacter | undefined {
		return this.cache.getOrSet("playerCharacter", () => {
			const channelDid = this.channel?.id as Snowflake;
			const userDid = this.sageUser.did;
			const autoChannelData = { channelDid, userDid };
			return this.game?.playerCharacters.getAutoCharacter(autoChannelData)
				?? this.game?.playerCharacters.findByUser(userDid)
				?? this.sageUser.playerCharacters.getAutoCharacter(autoChannelData);
		});
	}

	//#endregion

	public static async fromInteraction<T extends DInteraction>(interaction: T): Promise<SageInteraction<T>> {
		const sageCache = await SageCache.fromInteraction(interaction);
		const type = InteractionType.Unknown;
		const sageInteraction = new SageInteraction({
			sageCache,
			interaction,
			type
		});
		sageInteraction.isGameMaster = await sageInteraction.game?.hasUser(interaction.user.id as Snowflake, GameRoleType.GameMaster) ?? false;
		sageInteraction.isPlayer = await sageInteraction.game?.hasUser(interaction.user.id as Snowflake, GameRoleType.Player) ?? false;
		return sageInteraction;
	}

}
