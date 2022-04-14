import { isDefined } from "../../../sage-utils";
import { DInteraction, DUser, InteractionType, TRenderableContentResolvable } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
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

	public isCommand(name: string): boolean {
		return this.interaction.isCommand() && this.interaction.commandName === name;
	}

	public get commandCategories(): string[] {
		if (!this.interaction.isCommand()) {
			return [];
		}
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
		return this.interaction.isCommand() ? this.interaction.options.getString(name, required) : null;
	}

	/** Returns the message */
	public get interaction(): T {
		return this.core.interaction as T;
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
