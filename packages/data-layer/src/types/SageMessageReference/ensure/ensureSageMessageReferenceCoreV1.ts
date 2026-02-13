import { isNonNilSnowflake, snowflakeToDate } from "@rsc-utils/core-utils";
import type { SageMessageReferenceCoreV0, SageMessageReferenceCoreV1 } from "../../index.js";

export function ensureSageMessageReferenceCoreV1(core: SageMessageReferenceCoreV0 | SageMessageReferenceCoreV1): SageMessageReferenceCoreV1 {
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