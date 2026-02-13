import { debug, isNonNilSnowflake, snowflakeToDate, type Snowflake } from "@rsc-utils/core-utils";
import { assertArray, assertNumber, assertSageCore, assertString, isValidId, optional } from "../../../validation/index.js";
import { SageMessageReferenceV1Keys, type SageMessageReferenceCoreAny, type SageMessageReferenceCoreV1 } from "../../index.js";

const objectType = "Message";
export function assertSageMessageReferenceCoreV1(core: SageMessageReferenceCoreAny): core is SageMessageReferenceCoreV1 {
	if (!assertSageCore<SageMessageReferenceCoreV1>(core, objectType, SageMessageReferenceV1Keys)) return false;

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