import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { isSimpleObject, type DialogPostType } from "./index.js";

export type AutoChannelData = {
	channelId: Snowflake;
	dialogPostType?: DialogPostType;
	userId?: Snowflake;
};

export function isAutoChannelData(data: unknown, _userId?: Snowflake): data is AutoChannelData {
	// const matchingUserDid = !userDid || data.userDid === userDid;
	return isSimpleObject(data)
		&& isNonNilSnowflake(data.channelId)
		&& (!("dialogPostType" in data) || [0,1].includes(data.dialogPostType))
		&& (isNonNilSnowflake(data.userId) || !("userId" in data))
		// && matchingUserDid;
}
