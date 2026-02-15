import type { Snowflake } from "@rsc-utils/core-utils";
import type { SageChannelOptions } from "../options/SageChannelOptions.js";

export type SageChannelV1 = Partial<SageChannelOptions> & {
	/** @deprecated */
	did?: Snowflake;
	id: Snowflake;
};

