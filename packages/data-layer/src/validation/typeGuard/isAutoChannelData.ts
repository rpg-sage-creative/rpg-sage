import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import type { AutoChannelData } from "../../types/index.js";
import { isSimpleObject } from "./index.js";

export function isAutoChannelData(data: unknown, _userId?: Snowflake): data is AutoChannelData {
	// const matchingUserDid = !userDid || data.userDid === userDid;
	return isSimpleObject(data)
		&& isNonNilSnowflake(data.channelId)
		&& (!("dialogPostType" in data) || [0,1].includes(data.dialogPostType))
		&& (isNonNilSnowflake(data.userId) || !("userId" in data))
		// && matchingUserDid;
}
