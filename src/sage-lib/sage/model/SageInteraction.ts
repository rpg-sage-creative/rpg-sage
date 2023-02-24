import type { InteractionReplyOptions, Message, User, WebhookMessageOptions } from "discord.js";
import { RenderableContent } from "../../../sage-pf2e";
import { isDefined } from "../../../sage-utils";
import type { TGameType } from "../../../slash.mjs";
import { DInteraction, InteractionType, TChannel, TRenderableContentResolvable } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import { send } from "../../discord/messages";
import SageCache from "./SageCache";
import { SageCommandBase, SageCommandCore, TSendArgs } from "./SageCommand";
import SageInteractionArgs from "./SageInteractionArgs";

interface SageInteractionCore extends SageCommandCore {
	interaction: DInteraction;
	type: InteractionType;
}

export default class SageInteraction<T extends DInteraction = any>
	extends SageCommandBase<SageInteractionCore, SageInteractionArgs, SageInteraction<any>> {

	public constructor(protected core: SageInteractionCore) {
		super(core);
	}

	public args = new SageInteractionArgs(this.core.interaction);

	public isSageInteraction(): this is SageInteraction { return true; }

	/** The interaction's customId is exactly this string. */
	public customIdMatches(value: string): boolean;
	/** The interaction's customId .matches(regex) !== null */
	public customIdMatches(regex: RegExp): boolean;
	public customIdMatches(valueOrRegex: string | RegExp): boolean {
		if (this.interaction.isButton() || this.interaction.isSelectMenu()) {
			const customId = this.interaction.customId;
			return typeof(valueOrRegex) === "string"
				? customId === valueOrRegex
				: valueOrRegex.test(customId);
		}
		return false;
	}

	//#region SageCommand

	public clone(): SageInteraction<T> {
		return new SageInteraction(this.core);
	}

	//#endregion

	//#region command / category / sub

	public isCommand(command: string): boolean;
	public isCommand(gameType: TGameType, command: string): boolean;
	public isCommand(subCommand: string, command: string): boolean;
	public isCommand(...args: string[]): boolean {
		if (!this.interaction.isCommand()) {
			return false;
		}

		const command = args.pop()!;
		const commandLower = command.toLowerCase();

		const subCommand = args[0];
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

	/** Returns the interaction */
	public get interaction(): T {
		return this.core.interaction as T;
	}

	//#region defer/reply/send/whisper

	/** Flag toggled when followUp() is called. */
	private updates: Message<boolean>[] = [];

	/** Defers the interaction so that a reply can be sent later. */
	public async defer(ephemeral: boolean): Promise<void> {
		if (this.interaction.deferred) {
			return Promise.resolve();
		}
		if ("deferUpdate" in this.interaction) {
			return this.interaction.deferUpdate();
		}
		return this.interaction.deferReply({
			ephemeral:this.sageCache.server ? (ephemeral ?? true) : false
		});
	}

	/** Deletes the reply and any updates (ONLY IF NOT EPHEMERAL) */
	public async deleteReply(): Promise<void> {
		if ((this.interaction.replied || this.interaction.deferred) && !this.interaction.ephemeral) {
			if (this.updates.length) {
				await Promise.all(this.updates.map(update => update.deletable ? update.delete() : Promise.resolve()));
			}
			await this.interaction.deleteReply();
		}
	}

	/** Uses reply() it not replied to yet or editReply() to edit the previous reply. */
	public async reply(args: TSendArgs): Promise<void>;
	public async reply(renderable: TRenderableContentResolvable, ephemeral: boolean): Promise<void>;
	public async reply(renderableOrArgs: TRenderableContentResolvable | TSendArgs, ephemeral?: boolean): Promise<void> {
		/** @todo if (ephemeral === false && !this.canSend()) inform user about failure */
		const args = this.resolveToOptions(renderableOrArgs, ephemeral);
		if (this.interaction.deferred || this.interaction.replied) {
			await this.interaction.editReply(args as WebhookMessageOptions);
		}else {
			await this.interaction.reply(args as InteractionReplyOptions);
		}
	}

	/** Uses followUp() if a reply was given, otherwise uses reply()  */
	public async update(renderable: TRenderableContentResolvable, ephemeral: boolean): Promise<void> {
		if (this.interaction.replied) {
			const embeds = resolveToEmbeds(this.sageCache, renderable);
			this.updates.push(await this.interaction.followUp({ embeds:embeds }) as Message<boolean>);
		}else {
			await this.reply(renderable, ephemeral);
		}
	}

	/** Sends a full message to the channel or user the interaction originated in. */
	public send(renderableContentResolvable: TRenderableContentResolvable): Promise<Message[]>;
	public send(renderableContentResolvable: TRenderableContentResolvable, targetChannel: TChannel): Promise<Message[]>;
	public send(renderableContentResolvable: TRenderableContentResolvable, targetChannel: TChannel, originalAuthor: User): Promise<Message[]>;
	public async send(renderableContentResolvable: TRenderableContentResolvable, targetChannel = this.interaction.channel as TChannel, originalAuthor = this.interaction.user): Promise<Message[]> {
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

	public async whisper(args: TSendArgs): Promise<void>;
	public async whisper(content: string): Promise<void>;
	public async whisper(contentOrArgs: string | TSendArgs): Promise<void> {
		const args = typeof(contentOrArgs) === "string" ? { content:contentOrArgs } : { ...contentOrArgs };
		args.ephemeral = !!this.sageCache.server;
		return this.reply(args);
	}

	//#endregion

	public static async fromInteraction<T extends DInteraction>(interaction: T): Promise<SageInteraction<T>> {
		const sageCache = await SageCache.fromInteraction(interaction);
		const type = InteractionType.Unknown;
		return new SageInteraction({
			sageCache,
			interaction,
			type
		});
	}

}
