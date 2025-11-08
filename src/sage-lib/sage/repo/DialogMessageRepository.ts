import { isNonNilSnowflake, snowflakeToDate, type Snowflake } from "@rsc-utils/core-utils";
import { SageMessage, type SageMessageCore } from "./SageMessage.js";

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

/** @deprecated */
export { type SageMessageCore as DialogMessageDataCore };

/** @deprecated */
export { SageMessage as DialogMessageData };
export { SageMessage as DialogMessageRepository };

export function updateMessage(core: TDialogMessage | SageMessageCore): SageMessageCore {
	if ("messageDid" in core) {
		return {
			channelId: isNonNilSnowflake(core.threadDid) ? core.threadDid : core.channelDid,
			characterId: core.characterId,
			gameId: core.gameId,
			guildId: core.serverDid,
			id: core.messageDid,
			messageIds: [core.messageDid],
			objectType: "Message",
			timestamp: snowflakeToDate(core.messageDid).getTime(),
			userId: core.userDid,
			ver: 1
		};
	}

	const timestamp = snowflakeToDate(core.id).getTime();
	if (core.objectType !== "Message" || !core.ver || core.timestamp !== timestamp) {
		return { ...core as any, objectType:"Message", timestamp, ver:1 };
	}
	return core;
}