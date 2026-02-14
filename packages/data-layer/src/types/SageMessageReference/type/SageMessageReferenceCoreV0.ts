import type { Snowflake } from "@rsc-utils/core-utils";

/** @deprecated */
export type SageMessageReferenceCoreV0 = {
	channelDid: Snowflake;
	characterId: Snowflake;
	gameId: Snowflake;
	messageDid: Snowflake;
	serverDid: Snowflake;
	threadDid: Snowflake;
	timestamp: number;
	userDid: Snowflake;
	ver: number;
};