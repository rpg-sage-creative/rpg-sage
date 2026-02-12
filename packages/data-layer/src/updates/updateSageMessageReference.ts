import { isNonNilSnowflake, snowflakeToDate, type Snowflake } from "@rsc-utils/core-utils";
import type { SageMessageReferenceCore } from "../types/index.js";

/** @deprecated */
export type TDialogMessage = {
	channelDid: Snowflake;
	characterId: Snowflake;
	gameId: Snowflake;
	messageDid: Snowflake;
	serverDid: Snowflake;
	threadDid: Snowflake;
	timestamp: number;
	userDid: Snowflake;
};

export function updateSageMessageReference(core: TDialogMessage | SageMessageReferenceCore): SageMessageReferenceCore {
	if ("messageDid" in core) {
		return {
			channelId: isNonNilSnowflake(core.threadDid) ? core.threadDid : core.channelDid,
			characterId: core.characterId,
			gameId: core.gameId,
			guildId: core.serverDid,
			id: core.messageDid,
			messageIds: [core.messageDid],
			objectType: "Message",
			ts: snowflakeToDate(core.messageDid).getTime(),
			userId: core.userDid,
			ver: 1
		};
	}

	const ts = snowflakeToDate(core.id).getTime();
	if (core.objectType !== "Message" || !core.ver || core.ts !== ts) {
		const out = { ...core as any, objectType:"Message", ts, ver:1 };
		if ("timestamp" in out) delete out.timestamp;
		return out;
	}

	return core;
}