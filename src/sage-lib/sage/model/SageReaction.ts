import { Cache } from "@rsc-utils/cache-utils";
import { debug } from "@rsc-utils/console-utils";
import type { DMessage, DReaction, DUser } from "@rsc-utils/discord-utils";
import { ReactionType } from "../../discord/index.js";
import { GameRoleType } from "./Game.js";
import { SageCache } from "./SageCache.js";
import { SageCommand, type SageCommandCore } from "./SageCommand.js";

interface SageReactionCore extends SageCommandCore {
	messageReaction: DReaction;
	user: DUser;
	reactionType: ReactionType;
};

export class SageReaction
	extends SageCommand<SageReactionCore, SageReaction> {

	private constructor(protected core: SageReactionCore, cache?: Cache) {
		super(core, cache);
	}
	public clear(): void {
		debug("Clearing SageReaction");
		this.cache.clear();
		this.sageCache.clear();
	}

	public static async fromMessageReaction(messageReaction: DReaction, user: DUser, reactionType: ReactionType): Promise<SageReaction> {
		const sageCache = await SageCache.fromMessageReaction(messageReaction, user);
		const sageReaction = new SageReaction({
			sageCache,
			messageReaction,
			reactionType,
			user
		});
		sageReaction.isGameMaster = await sageReaction.game?.hasUser(user.id, GameRoleType.GameMaster) ?? false;
		sageReaction.isPlayer = await sageReaction.game?.hasUser(user.id, GameRoleType.Player) ?? false;
		return sageReaction;
	}
	public get isAdd(): boolean {
		return this.core.reactionType === ReactionType.Add;
	}

	public get isRemove(): boolean {
		return this.core.reactionType === ReactionType.Remove;
	}

	/** Returns the message */
	public get messageReaction(): DReaction {
		return this.core.messageReaction;
	}

	public get user(): DUser {
		return this.core.user;
	}

	public get message(): DMessage {
		return this.core.messageReaction.message as DMessage;
	}

	public clone(): SageReaction {
		return new SageReaction(this.core, this.cache);
	}

	public command: string | null = null;

}
