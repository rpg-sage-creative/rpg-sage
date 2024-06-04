import type { Cache } from "@rsc-utils/cache-utils";
import { debug, warn } from "@rsc-utils/console-utils";
import { DiscordKey, DMessage, type DInteraction, type DMessageChannel, type DUser } from "@rsc-utils/discord-utils";
import { RenderableContent, type RenderableContentResolvable } from "@rsc-utils/render-utils";
import type { Snowflake } from "@rsc-utils/snowflake-utils";
import { isString } from "@rsc-utils/string-utils";
import { isDefined } from "@rsc-utils/type-utils";
import type { InteractionReplyOptions, InteractionUpdateOptions, Message, MessageAttachment, User } from "discord.js";
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
import { addMessageDeleteButton } from "./utils/deleteButton.js";

interface SageInteractionCore extends SageCommandCore {
	interaction: DInteraction;
	type: InteractionType;
}

export class SageInteraction<T extends DInteraction = any>
	extends SageCommand<SageInteractionCore, SageInteractionArgs>
	implements HasGame, HasChannels {

	private constructor(protected core: SageInteractionCore, cache?: Cache) {
		super(core, cache);
		this.args = new SageInteractionArgs(this);
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

	public isCommand(command: string): boolean;
	public isCommand(sub: string, command: string): boolean;
	public isCommand(gameType: SlashCommandGameType, command: string): boolean;
	public isCommand(...args: string[]): boolean {
		if (!this.interaction.isCommand() && !this.interaction.isContextMenu()) {
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

		if (subCommand) {
			return commandValues[0] === subCommandLower
				&& commandValues[1] === commandLower;
		}

		return commandValues[0] === commandLower;
	}

	public get commandValues(): string[] {
		if (this.interaction.isCommand()) {
			return [
				this.interaction.commandName,
				this.interaction.options.getSubcommandGroup(false),
				this.interaction.options.getSubcommand(false)
			].filter(isDefined);
		}
		if (this.interaction.isContextMenu()) {
			return [
				this.interaction.commandName
			];
		}
		return [];
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

	/** Convenience for .interation.deferReply().then(() => .interaction.deleteReply()) */
	public async noDefer(): Promise<void> {
		if (!this.isSageInteraction("REPLIABLE")) return; // NOSONAR

		if (!this.interaction.deferred && !this.interaction.replied) {
			await this.defer(true);
			await this.interaction.deleteReply();
			this._noReply = true;
		}
	}

	private _noReply = false;

	/** Defers the interaction so that a reply can be sent later. */
	public async defer(_ephemeral: boolean): Promise<void> {
		if (!this.isSageInteraction("REPLIABLE")) return; // NOSONAR

		if (!this.interaction.deferred) {
			if ("deferUpdate" in this.interaction) {
				await this.interaction.deferUpdate();
			}else if ("deferReply" in this.interaction) {
				await this.interaction.deferReply({
					ephemeral: false
					// ephemeral:this.sageCache.server ? (ephemeral ?? true) : false
				});
			}else {
				warn(`IDE says we should never reach this code ...`);
			}
		}
	}

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
		if (this._noReply) {
			const message = await this.interaction.channel?.send(args);
			if (message) {
				await addMessageDeleteButton(message as DMessage, this.sageUser.did);
				this.updates.push(message);
			}

		}else if (this.interaction.deferred || this.interaction.replied) {
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

	//#region HasGame

	/** Get the PlayerCharacter if there a game and the actor has a PlayerCharacter OR the actor has a PlayerCharacter set to use this channel with AutoChannel */
	public get playerCharacter(): GameCharacter | undefined {
		return this.cache.get("playerCharacter", () => {
			const channelDid = this.channel?.id!;
			const userDid = this.sageUser.did;
			const autoChannelData = { channelDid, userDid };
			return this.game?.playerCharacters.getAutoCharacter(autoChannelData)
				?? this.game?.playerCharacters.findByUser(userDid)
				?? this.sageUser.playerCharacters.getAutoCharacter(autoChannelData)
				?? undefined;
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
		sageInteraction.isGameMaster = await sageInteraction.game?.hasUser(interaction.user.id, GameRoleType.GameMaster) ?? false;
		sageInteraction.isPlayer = await sageInteraction.game?.hasUser(interaction.user.id, GameRoleType.Player) ?? false;
		return sageInteraction;
	}

}
