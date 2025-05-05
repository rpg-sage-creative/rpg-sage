import { HasIdCore, type IdCore, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import type { SageCache } from "../../model/SageCache.js";

export class HasSageCacheCore<T extends IdCore<U>, U extends string = string> extends HasIdCore<T, U> {
	public constructor(core: T, public sageCache: SageCache) { super(core); }

	/** @deprecated transitional until all cores/entities no longer have did/uuid */
	public get did(): Snowflake { return this.core.did ?? this.core.id as Snowflake; }

	/** @deprecated transitional until all cores/entities no longer have did/uuid */
	public get uuid(): UUID { return this.core.uuid ?? this.core.id as UUID; }
}
