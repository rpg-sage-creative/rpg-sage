import { isNonNilSnowflake, parseSnowflake, snowflakeToDate } from "@rsc-utils/core-utils";
import type { EnsureContext } from "../../../validation/index.js";
import type { SageMessageReferenceCoreAny, SageMessageReferenceCoreV1 } from "../../index.js";

export function ensureSageMessageReferenceCoreV1(core: SageMessageReferenceCoreAny, context?: EnsureContext): SageMessageReferenceCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

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
			userId: parseSnowflake(core.userDid) ?? context?.userId!,
			ver: 1
		};
	}

	return {
		channelId: core.channelId,
		characterId: core.characterId,
		gameId: core.gameId,
		guildId: core.guildId,
		id: core.id,
		messageIds: core.messageIds,
		objectType: "Message",
		ts: snowflakeToDate(core.id).getTime(),
		userId: parseSnowflake(core.userId) ?? context?.userId!,
		ver: 1
	};
}