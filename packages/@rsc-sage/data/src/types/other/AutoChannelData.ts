import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { ensureEnum } from "../../validation/ensure/ensureEnum.js";
import { DialogPostType } from "../enums/DialogPostType.js";

export type AutoChannelData = {
	channelId: Snowflake;
	dialogPostType?: DialogPostType;
	userId?: Snowflake;
};

type AutoChannelDataResolvable = AutoChannelData | string | { channelDid:Snowflake; dialogPostType?:0|1; userDid?:Snowflake; };

export function ensureAutoChannelData(core: AutoChannelDataResolvable): AutoChannelData {
	if (typeof(core) === "string") {
		return { channelId:core as Snowflake };
	}
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

/** Compares channelId and userId of both AutoChannelData objects. Also compares dialogPostType when exact is true. */
export function autoChannelDataMatches(a: Optional<AutoChannelData>, b: Optional<AutoChannelData>, exact?: boolean): boolean {
	if (!a || !b) return false;
	return exact
		? a.channelId === b.channelId && a.dialogPostType === b.dialogPostType && a.userId === b.userId
		: a.channelId === b.channelId && a.userId === b.userId;
}