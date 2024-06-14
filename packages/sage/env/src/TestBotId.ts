import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { SnowflakeResolvable } from "@rsc-utils/discord-utils";

let _testBotId: Snowflake;
export function setTestBotId(testBotId: Snowflake): void {
	_testBotId = testBotId;
}

export function getTestBotId(): Snowflake {
	return _testBotId;
}

export function isTestBotId(id: Optional<SnowflakeResolvable>): id is Snowflake {
	return _testBotId && id ? _testBotId === id : false;
}