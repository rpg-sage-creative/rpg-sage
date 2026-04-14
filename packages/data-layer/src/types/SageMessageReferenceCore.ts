import { isNonNilSnowflake, isValidId, parseSnowflake, snowflakeToDate, type Snowflake } from "@rsc-utils/core-utils";
import { assertArray, assertNumber, assertSageCore, assertString, optional, type EnsureContext } from "../validation/index.js";
import type { SageCore } from "./index.js";

export type SageMessageReferenceCoreAny = SageMessageReferenceCore | SageMessageReferenceCoreOld;

/** @deprecated */
export type SageMessageReferenceCoreOld = SageMessageReferenceCore & {
	/** @deprecated */
	channelDid: Snowflake;
	/** @deprecated */
	messageDid: Snowflake;
	/** @deprecated */
	serverDid: Snowflake;
	/** @deprecated */
	threadDid: Snowflake;
	/** @deprecated */
	timestamp: number;
	/** @deprecated */
	userDid: Snowflake;
};

export type SageMessageReferenceCore = Omit<SageCore<"Message", Snowflake>, "did" | "uuid"> & {

	/** the id of the channel the message is in */
	channelId: Snowflake;

	/** the id of the character the message is from */
	characterId: Snowflake;

	/** the id of the game the message is in */
	gameId?: Snowflake;

	/** the id of the guild the message is in */
	guildId: Snowflake;

	// id from SageCore

	/** the ids of the messages from a dialog that was too long and split over multiple messages */
	messageIds: Snowflake[];

	// objectType from SageCore

	/** the timestamp of the message */
	ts: number;

	/** the id of the user that posted the dialog */
	userId: Snowflake;

};

export const SageMessageReferenceKeys: (keyof SageMessageReferenceCore)[] = [
	"channelId",
	"characterId",
	"gameId",
	"guildId",
	"id",           // from SageCore
	"messageIds",
	"objectType",   // from SageCore
	"ts",
	"userId",
];

const objectType = "Message";
export function assertSageMessageReferenceCore(core: unknown): core is SageMessageReferenceCore {
	if (!assertSageCore<SageMessageReferenceCore>(core, objectType, SageMessageReferenceKeys)) return false;

	const isValidTimestamp = (messageId: string) => {
		const idTimestamp = snowflakeToDate(messageId as Snowflake).getTime();
		return (timestamp: number) => timestamp === idTimestamp;
	};

	if (!assertString({ core, objectType, key:"channelId", validator:isNonNilSnowflake })) return false;
	if (!assertString({ core, objectType, key:"characterId", validator:isValidId })) return false;
	if (!assertString({ core, objectType, key:"gameId", validator:isValidId, optional })) return false;
	if (!assertString({ core, objectType, key:"guildId", validator:isNonNilSnowflake })) return false;
	// id
	if (!assertArray({ core, objectType, key:"messageIds", validator:isNonNilSnowflake })) return false;
	// objectType
	if (!assertNumber({ core, objectType, key:"ts", validator:isValidTimestamp })) return false;
	if (!assertString({ core, objectType, key:"userId", optional, validator:isNonNilSnowflake })) return false;

	return true;
}

export function ensureSageMessageReferenceCore(core: SageMessageReferenceCoreAny, context?: EnsureContext): SageMessageReferenceCore {
	// there was a bug that caused these references to nest
	while ("core" in core) core = core.core as SageMessageReferenceCoreAny;

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
	};

}