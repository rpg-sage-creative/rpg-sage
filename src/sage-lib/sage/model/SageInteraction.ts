import type * as Discord from "discord.js";
import type { TGameType } from "../../../sage-dice";
import utils, { isDefined } from "../../../sage-utils";
import { DInteraction, DiscordKey, DUser, InteractionType, TChannel, TRenderableContentResolvable } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import { send } from "../../discord/messages";
import HasSageCache, { HasSageCacheCore } from "./HasSageCache";
import SageCache from "./SageCache";

interface SageInteractionCore extends HasSageCacheCore {
	interaction: DInteraction;
	type: InteractionType;
}

export default class SageInteraction<T extends DInteraction = any>
	extends HasSageCache<SageInteractionCore, SageInteraction<any>> {

	public constructor(protected core: SageInteractionCore) {
		super(core);
	}

	//#region HasSageCache

	public clone(): SageInteraction<T> {
		return new SageInteraction(this.core);
	}

	//#endregion

	//#region command / category / sub

	public isCommand(command: string): boolean;
	public isCommand(gameType: TGameType, command: string): boolean;
	public isCommand(...args: string[]): boolean {
		if (!this.interaction.isCommand()) {
			return false;
		}

		const command = args.pop()!;
		const commandLower = command.toLowerCase();

		const game = args[0] as TGameType;
		const gameLower = game?.toLowerCase();

		const commandValues = this.commandValues.map(s => s.toLowerCase());
		if (commandValues[0] === "sage") {
			commandValues.shift();
		}

		if (game) {
			return commandValues[0] === gameLower
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
	public getString(name: string): string | null;
	/** Gets the named option as a string */
	public getString(name: string, required: true): string;
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
	private updates: Discord.Message<boolean>[] = [];

	/** Defers the interaction so that a reply can be sent later. */
	public async defer(ephemeral: boolean): Promise<void> {
		return this.interaction.deferReply({ ephemeral:ephemeral ?? true });
	}

	/** Deletes the reply and any updates (ONLY IF NOT EPHEMERAL) */
	public async deleteReply(): Promise<void> {
		if (this.interaction.replied && !this.interaction.ephemeral) {
			if (this.updates.length) {
				await Promise.all(this.updates.map(update => update.deletable ? update.delete() : Promise.resolve()));
			}
			await this.interaction.deleteReply();
		}
	}

	/** Uses reply() it not replied to yet or editReply() to edit the previous reply. */
	public async reply(renderable: TRenderableContentResolvable, ephemeral: boolean): Promise<void> {
		const embeds = resolveToEmbeds(this.caches, renderable);
		if (this.interaction.deferred || this.interaction.replied) {
			await this.interaction.editReply({ embeds:embeds });
		}else {
			await this.interaction.reply({ embeds:embeds, ephemeral:ephemeral ?? true });
		}
	}

	/** Uses followUp() if a reply was given, otherwise uses reply()  */
	public async update(renderable: TRenderableContentResolvable, ephemeral: boolean): Promise<void> {
		if (this.interaction.replied) {
			const embeds = resolveToEmbeds(this.caches, renderable);
			this.updates.push(await this.interaction.followUp({ embeds:embeds }) as Discord.Message<boolean>);
		}else {
			await this.reply(renderable, ephemeral);
		}
	}

	/** Sends a full message to the channel or user the interaction originated in. */
	public send(renderableContentResolvable: TRenderableContentResolvable): Promise<Discord.Message[]>;
	public send(renderableContentResolvable: TRenderableContentResolvable, targetChannel: TChannel): Promise<Discord.Message[]>;
	public send(renderableContentResolvable: TRenderableContentResolvable, targetChannel: TChannel, originalAuthor: Discord.User): Promise<Discord.Message[]>;
	public async send(renderableContentResolvable: TRenderableContentResolvable, targetChannel = this.interaction.channel as TChannel, originalAuthor = this.interaction.user): Promise<Discord.Message[]> {
		const canSend = await this.canSend(targetChannel);
		if (!canSend) {
			return [];
		}
		// check to see if we have channel send message permissions
		const renderableContent = utils.RenderUtils.RenderableContent.resolve(renderableContentResolvable);
		if (renderableContent) {
			return send(this.caches, targetChannel, renderableContent, originalAuthor);
		}
		return [];
	}
	public async canSend(targetChannel = this.interaction.channel as TChannel): Promise<boolean> {
		return this.caches.canSendMessageTo(DiscordKey.fromChannel(targetChannel));
	}

	//#endregion

	public static async fromInteraction<T extends DInteraction>(interaction: T): Promise<SageInteraction<T>> {
		const caches = await SageCache.fromInteraction(interaction);
		const type = InteractionType.Unknown;
		return new SageInteraction({
			caches,
			interaction,
			type
		});
	}

}
