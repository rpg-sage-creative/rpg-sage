import { debug, isNonNilSnowflake, snowflakeToDate, type Snowflake } from "@rsc-utils/core-utils";
import { assertArray, assertNumber, assertSageCore, assertString, optional } from "../../assertions/index.js";
import { isValidId } from "../../types/isValidId.js";
import type { SageCore } from "../../types/types.js";

export type SageMessageReferenceV1 = Omit<SageCore<"Message", Snowflake>, "did" | "uuid"> & {
	/** the id of the channel the message is in */
	channelId: Snowflake;
	/** the id of the character the message is from */
	characterId: Snowflake;
	/** the id of the game the message is in */
	gameId?: Snowflake;
	/** the id of the guild the message is in */
	guildId: Snowflake;
	/** the ids of the messages from a dialog that was too long and split over multiple messages */
	messageIds: Snowflake[];
	/** the timestamp of the message */
	ts: number;
	/** the id of the user that posted the dialog */
	userId: Snowflake;
};

export const SageMessageReferenceV1Keys: (keyof SageMessageReferenceV1)[] = [
	"channelId",
	"characterId",
	"gameId",
	"guildId",
	"id",
	"messageIds",
	"objectType",
	"ts",
	"userId",
	"ver",
];

const objectType = "Message";
export function assertSageMessageReferenceV1(core: unknown): core is SageMessageReferenceV1 {
	if (!assertSageCore<SageMessageReferenceV1>(core, objectType, SageMessageReferenceV1Keys)) return false;

	const isValidTimestamp = (messageId: string) => {
		const idTimestamp = snowflakeToDate(messageId as Snowflake).getTime();
		return (timestamp: number) => timestamp === idTimestamp;
	};

	if (!assertString({ core, objectType, key:"channelId", validator:isNonNilSnowflake })) return false;
	if (!assertString({ core, objectType, key:"characterId", validator:isValidId })) return false;
	if (!assertString({ core, objectType, key:"gameId", validator:isValidId, optional })) return false;
	if (!assertString({ core, objectType, key:"guildId", validator:isNonNilSnowflake })) return false;
	if (!assertString({ core, objectType, key:"id", validator:isNonNilSnowflake })) return false;
	if (!assertArray({ core, objectType, key:"messageIds", validator:isNonNilSnowflake })) return false;
	// objectType
	if (!assertNumber({ core, objectType, key:"ts", validator:isValidTimestamp })) return false;
	if (!assertString({ core, objectType, key:"userId", validator:isNonNilSnowflake })) {
		debug({userId:(core as any).coreId,userDid:(core as any).userDid,core});
		return false;
	}
	if (!assertNumber({ core, objectType, key:"ver", validator:ver => ver === 1 })) return false;

	return true;
}