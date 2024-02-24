import { Cache } from "@rsc-utils/cache-utils";
import { debug, warn } from "@rsc-utils/console-utils";
import { DiscordKey, type DInteraction, type DMessageChannel, type DUser } from "@rsc-utils/discord-utils";
import { RenderableContent, RenderableContentResolvable } from "@rsc-utils/render-utils";
import type { Snowflake } from "@rsc-utils/snowflake-utils";
import { isDefined } from "@rsc-utils/type-utils";
import type { Message, MessageAttachment, User } from "discord.js";
import type { SlashCommandGameType } from "../../../SlashTypes.js";
import { GameType } from "../../../sage-common/index.js";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice/index.js";
import { deleteMessages } from "../../discord/deletedMessages.js";
import { resolveToEmbeds } from "../../discord/embeds.js";
import { InteractionType } from "../../discord/index.js";
import { send } from "../../discord/messages.js";
import { DicePostType } from "../commands/dice.js";
import type { IChannel } from "../repo/base/IdRepository.js";
import { GameRoleType } from "./Game.js";
import type { GameCharacter } from "./GameCharacter.js";
import { SageCache } from "./SageCache.js";
import { SageCommand, type SageCommandCore } from "./SageCommand.js";
import type { IHasChannels, IHasGame } from "./index.js";

interface SageInteractionCore extends SageCommandCore {
	interaction: DInteraction;
	type: InteractionType;
}

export class SageInteraction<T extends DInteraction = any>
	extends SageCommand<SageInteractionCore, SageInteraction<any>>
	implements IHasGame, IHasChannels {

	private constructor(protected core: SageInteractionCore, cache?: Cache) {
		super(core, cache);
	}

	//#region HasSageCache

	/** @todo: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE! */
	public clone(): SageInteraction<T> {
		return new SageInteraction(this.core, this.cache);
	}

	public clear(): void {
		debug("Clearing SageInteraction");
		this.cache.clear();
		this.sageCache.clear();
	}

	//#endregion

	//#region command / category / sub

	public isCommand(command: string): boolean;
	public isCommand(sub: string, command: string): boolean;
	public isCommand(gameType: SlashCommandGameType, command: string): boolean;
	public isCommand(...args: string[]): boolean {
		if (!this.interaction.isCommand()) {
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

		if (subCommand) {
			return commandValues[0] === subCommandLower
				&& commandValues[1] === commandLower;
		}

		return commandValues[0] === commandLower;
	}

	public get commandValues(): string[] {
		if (!this.interaction.isCommand()) {
			return [];
		}
		return [
			this.interaction.commandName,
			this.interaction.options.getSubcommandGroup(false),
			this.interaction.options.getSubcommand(false)
		].filter(isDefined);
	}

	//#endregion

	public getAttachment(name: string): MessageAttachment | null;
	public getAttachment(name: string, required: true): MessageAttachment;
	public getAttachment(name: string, required = false): MessageAttachment | null {
		return this.interaction.isCommand() ? this.interaction.options.getAttachment(name, required) : null;
	}

	public hasAttachment(name: string): boolean {
		return this.getAttachment(name) !== null;
	}

	public getAttachmentPdf(name: string): MessageAttachment | null;
	public getAttachmentPdf(name: string, required: true): MessageAttachment;
	public getAttachmentPdf(name: string, required = false): MessageAttachment | null {
		const attachment = this.interaction.isCommand() ? this.interaction.options.getAttachment(name, required) : null;
		return attachment?.contentType === "application/pdf" ? attachment : null;
	}

	public hasAttachmentPdf(name: string): boolean {
		return this.getAttachmentPdf(name) !== null;
	}

	/** Gets the named option as a boolean or null */
	public getBoolean(name: string): boolean | null;
	/** Gets the named option as a boolean */
	public getBoolean(name: string, required: true): boolean;
	public getBoolean(name: string, required = false): boolean | null {
		return this.interaction.isCommand() ? this.interaction.options.getBoolean(name, required) : null;
	}
	/** Returns true if the argument was given a value. */
	public hasBoolean(name: string): boolean {
		return this.getBoolean(name) !== null;
	}

	/** Gets the named option as a number or null */
	public getNumber(name: string): number | null;
	/** Gets the named option as a number */
	public getNumber(name: string, required: true): number;
	public getNumber(name: string, required = false): number | null {
		return this.interaction.isCommand() ? this.interaction.options.getNumber(name, required) : null;
	}
	/** Returns true if the argument was given a value. */
	public hasNumber(name: string): boolean {
		return this.getNumber(name) !== null;
	}

	/** Gets the named option as a string or null */
	public getString<U extends string = string>(name: string): U | null;
	/** Gets the named option as a string */
	public getString<U extends string = string>(name: string, required: true): U;
	public getString(name: string, required = false): string | null {
		return this.interaction.isCommand() ? this.interaction.options.getString(name, required) : null;
	}
	/** Returns true if the argument was given a value. */
	public hasString(name: string): boolean {
		return this.getString(name) !== null;
	}

	/** Returns the interaction */
	public get interaction(): T {
		return this.core.interaction as T;
	}

	/** Returns the user */
	public get user(): DUser {
		return this.core.interaction.user;
	}

	//#region defer/reply

	/** Flag toggled when followUp() is called. */
	private updates: Message<boolean>[] = [];

	/** Defers the interaction so that a reply can be sent later. */
	public defer(ephemeral: boolean): Promise<void> {
		return this.pushToReplyStack(() => {
			if (this.interaction.deferred) {
				return Promise.resolve();
			}
			if ("deferUpdate" in this.interaction) {
				return this.interaction.deferUpdate();
			}
			warn(`IDE says we should never reach this code ...`);
			return (this.interaction as any).deferReply({
				ephemeral:this.sageCache.server ? (ephemeral ?? true) : false
			});
		});
	}

	/** Deletes the reply and any updates (ONLY IF NOT EPHEMERAL) */
	public async deleteReply(): Promise<void> {
		return this.pushToReplyStack(async () => {
			if (this.interaction.replied) {
				if (this.updates.length) {
					await deleteMessages(this.updates);
				}
				await this.interaction.deleteReply();
			}
		});
	}

	private replyStack?: Promise<any>;
	private pushToReplyStack(fn: () => Promise<any>): Promise<any> {
		if (!this.replyStack) {
			this.replyStack = Promise.resolve();
		}
		this.replyStack = this.replyStack.then(fn);
		return this.replyStack;
	}

	/** Uses reply() it not replied to yet or editReply() to edit the previous reply. */
	public async reply(renderable: RenderableContentResolvable, ephemeral: boolean): Promise<void> {
		return this.pushToReplyStack(async () => {
			const embeds = resolveToEmbeds(this.sageCache, renderable);
			if (this.interaction.deferred || this.interaction.replied) {
				if (ephemeral || this.interaction.ephemeral) {
					this.updates.push(await this.interaction.followUp({ embeds:embeds }) as Message<boolean>);
					return Promise.resolve();
				}else {
					return this.interaction.editReply({ embeds:embeds }) as any;
				}
			}else {
				return this.interaction.reply({ embeds:embeds, ephemeral:this.sageCache.server ? (ephemeral ?? true) : false });
			}
		});
	}

	/** Uses followUp() if a reply was given, otherwise uses reply()  */
	public async update(renderable: RenderableContentResolvable, ephemeral: boolean): Promise<void> {
		return this.pushToReplyStack(async () => {
			if (this.interaction.replied) {
				const embeds = resolveToEmbeds(this.sageCache, renderable);
				this.updates.push(await this.interaction.followUp({ embeds:embeds }) as Message<boolean>);
			}else {
				await this.reply(renderable, ephemeral);
			}
		});
	}

	/** Sends a full message to the channel or user the interaction originated in. */
	public send(renderableContentResolvable: RenderableContentResolvable): Promise<Message[]>;
	public send(renderableContentResolvable: RenderableContentResolvable, targetChannel: DMessageChannel): Promise<Message[]>;
	public send(renderableContentResolvable: RenderableContentResolvable, targetChannel: DMessageChannel, originalAuthor: User): Promise<Message[]>;
	public async send(renderableContentResolvable: RenderableContentResolvable, targetChannel = this.interaction.channel as DMessageChannel, originalAuthor = this.interaction.user): Promise<Message[]> {
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
	public async canSend(targetChannel = this.interaction.channel as DMessageChannel): Promise<boolean> {
		return this.sageCache.canSendMessageTo(DiscordKey.fromChannel(targetChannel));
	}

	//#endregion

	// #region IHasChannels

	/** Returns the gameChannel meta, or the serverChannel meta if no gameChannel exists. */
	public get channel(): IChannel | undefined {
		return this.cache.get("channel", () => this.gameChannel ?? this.serverChannel);
	}

	/** Returns the channelDid this message (or its thread) is in. */
	public get channelDid(): Snowflake | undefined {
		return this.cache.get("channelDid", () => {
			if (this.interaction.channel?.isThread()) {
				return this.interaction.channel.parentId ?? undefined;
			}
			return this.interaction.channelId ?? undefined;
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

	/** Returns the threadDid this message is in. */
	public get threadDid(): Snowflake | undefined {
		return this.cache.get("threadDid", () => {
			if (this.interaction.channel?.isThread()) {
				return this.interaction.channelId ?? undefined;
			}
			return undefined;
		});
	}

	/** Returns either the message's threadDid or channelDid if there is no thread. */
	public get threadOrChannelDid(): Snowflake {
		return this.cache.get("channelDid", () => this.threadDid ?? this.channelDid ?? this.interaction.channelId!);
	}

	// #endregion

	//#region IHasGame

	public get gameType(): GameType {
		return this.cache.get("gameType", () => this.game?.gameType ?? this.serverChannel?.defaultGameType ?? this.server?.defaultGameType ?? GameType.None);
	}

	/** Get the PlayerCharacter if there a game and the actor has a PlayerCharacter OR the actor has a PlayerCharacter set to use this channel with AutoChannel */
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

	public get critMethodType(): CritMethodType {
		return this.cache.get("critMethodType", () => this.gameChannel?.defaultCritMethodType ?? this.game?.defaultCritMethodType ?? this.serverChannel?.defaultCritMethodType ?? this.server?.defaultCritMethodType ?? CritMethodType.Unknown);
	}

	public get dicePostType(): DicePostType {
		return this.cache.get("dicePostType", () => this.gameChannel?.defaultDicePostType ?? this.game?.defaultDicePostType ?? this.serverChannel?.defaultDicePostType ?? this.server?.defaultDicePostType ?? DicePostType.SinglePost);
	}

	public get diceOutputType(): DiceOutputType {
		return this.cache.get("diceOutputType", () => this.gameChannel?.defaultDiceOutputType ?? this.game?.defaultDiceOutputType ?? this.serverChannel?.defaultDiceOutputType ?? this.server?.defaultDiceOutputType ?? DiceOutputType.M);
	}

	public get diceSecretMethodType(): DiceSecretMethodType {
		return this.cache.get("diceSecretMethodType", () => this.gameChannel?.defaultDiceSecretMethodType ?? this.game?.defaultDiceSecretMethodType ?? this.serverChannel?.defaultDiceSecretMethodType ?? this.server?.defaultDiceSecretMethodType ?? DiceSecretMethodType.Ignore);
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
		sageInteraction.isGameMaster = await sageInteraction.game?.hasUser(interaction.user.id, GameRoleType.GameMaster) ?? false;
		sageInteraction.isPlayer = await sageInteraction.game?.hasUser(interaction.user.id, GameRoleType.Player) ?? false;
		return sageInteraction;
	}

}
