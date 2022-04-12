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

	/** Gets the named option as a string or null */
	public getString(name: string): string | null;
	/** Gets the named option as a string */
	public getString(name: string, required: true): string;
	public getString(name: string, required = false): string | null {
		return this.interaction.options.getString(name, required);
	}

	/** Returns the message */
	public get interaction(): DInteraction {
		return this.core.interaction;
	}

	public get user(): DUser {
		return this.core.interaction.user;
	}

	//#region defer/reply

	private deferred = false;

	public async defer(ephemeral?: boolean): Promise<void> {
		this.deferred = true;
		return this.interaction.deferReply({ ephemeral:ephemeral ?? true });
	}

	/** Assumes ephemeral unless given a false value. */
	public async reply(renderable: TRenderableContentResolvable, ephemeral?: boolean): Promise<void> {
		const embeds = resolveToEmbeds(this.caches, renderable);
		if (this.deferred) {
			this.interaction.editReply({ embeds:embeds });
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
