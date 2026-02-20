import type { Snowflake } from "@rsc-utils/core-utils";
import type { DialogPostType } from "../enums/DialogPostType.js";

export type AutoChannelData = {
	channelId: Snowflake;
	dialogPostType?: DialogPostType;
	userId?: Snowflake;
};
