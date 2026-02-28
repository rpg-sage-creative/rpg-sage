import type { Snowflake } from "@rsc-utils/core-utils";
import { ensureEnum } from "../../validation/ensure/ensureEnum.js";
import { DialogPostType } from "../enums/DialogPostType.js";

export type AutoChannelData = {
	channelId: Snowflake;
	dialogPostType?: DialogPostType;
	userId?: Snowflake;
};

type AutoChannelDataResolvable = AutoChannelData | string | { channelDid:Snowflake; dialogPostType?:0|1; userDid?:Snowflake; };

export function ensureAutoChannelData(core: AutoChannelDataResolvable): AutoChannelData {
	if (typeof(core) === "string") return { channelId:core as Snowflake };
	if ("channelDid" in core) {
		return {
			channelId: core.channelDid,
			dialogPostType: ensureEnum(DialogPostType, core.dialogPostType),
			userId: core.userDid
		};
	}
	return {
		channelId: core.channelId,
		dialogPostType: ensureEnum(DialogPostType, core.dialogPostType),
		userId: core.userId
	};
}
