import type { Snowflake } from "discord.js";
import { HasIdCoreAndSageCache } from "./HasIdCoreAndSageCache";
import type { IdCore } from "../../../../sage-utils/ClassUtils";

/** Represents a core with a did Snowflake value to represent the DiscordID. */
export interface DidCore<T extends string = string> extends IdCore<T> {
	/** The core's DiscordID */
	did: Snowflake;
}

/** Represents a class the contains a DidCore. */
export class HasDidCore<T extends DidCore<U>, U extends string = string> extends HasIdCoreAndSageCache<T, U> {
	/** The object's DiscordID */
	public get did(): Snowflake { return this.core.did; }
}