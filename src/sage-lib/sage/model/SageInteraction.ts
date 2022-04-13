import { isDefined } from "../../../sage-utils";
import { DInteraction, DUser, InteractionType, TRenderableContentResolvable } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import HasSageCache, { HasSageCacheCore } from "./HasSageCache";
import SageCache from "./SageCache";

interface SageInteractionCore extends HasSageCacheCore {
	interaction: DInteraction;
	type: InteractionType;
}

export default class SageInteraction
	extends HasSageCache<SageInteractionCore, SageInteraction> {

	public constructor(protected core: SageInteractionCore) {
		super(core);
	}

	//#region HasSageCache

	public clone(): SageInteraction {
		return new SageInteraction(this.core);
	}

	//#endregion

	public isCommand(name: string): boolean {
		const lower = name.toLowerCase();
		const thisCommandLower = this.command.toLowerCase();
		const thisCategoryLower = this.commandCategory?.toLowerCase();
		return thisCommandLower === lower
			|| (thisCommandLower === "sage" && thisCategoryLower === lower);
	}

	public get command(): string {
		return this.interaction.commandName;
	}
	public get commandCategories(): string[] {
		return [
			this.interaction.options.getSubcommandGroup(false),
			this.interaction.options.getSubcommand(false)
		].filter(isDefined);
	}
	public get commandCategory(): string | undefined {
		return this.commandCategories[0];
	}
	public get commandSubCategory(): string | undefined {
		return this.commandCategories[1];
	}

	/** Gets the named option and returns true if "yes" or "true", false otherwise */
	public getBoolean(name: string): boolean {
		const stringValue = this.getString(name);
		return stringValue === "yes" || stringValue === "true";
	}

	/** Gets the named option as a string or null */
	public getString(name: string): string | null;
	/** Gets the named option as a string */
	public getString(name: string, required: true): string;
	public getString(name: string, required = false): string | null {
		return this.interaction.options.getString(name, required);
	}

	/** Returns the interaction */
	public get interaction(): DInteraction {
		return this.core.interaction;
	}

	/** Returns the user */
	public get user(): DUser {
		return this.core.interaction.user;
	}

	//#region defer/reply

	private deferred = false;

	/** Defers the interaction so that a reply can be sent later. */
	public async defer(ephemeral: boolean): Promise<void> {
		this.deferred = true;
		return this.interaction.deferReply({ ephemeral:ephemeral ?? true });
	}

	/** Replies to the given interaction. */
	public async reply(renderable: TRenderableContentResolvable, ephemeral: boolean): Promise<void> {
		const embeds = resolveToEmbeds(this.caches, renderable);
		if (this.deferred) {
			return this.interaction.editReply({ embeds:embeds }) as Promise<any>;
		}
		return this.interaction.reply({ embeds:embeds, ephemeral:ephemeral ?? true });
	}

	//#endregion

	public static async fromInteraction(interaction: DInteraction): Promise<SageInteraction> {
		const caches = await SageCache.fromInteraction(interaction);
		const type = InteractionType.Unknown;
		return new SageInteraction({
			caches,
			interaction,
			type
		});
	}

}
