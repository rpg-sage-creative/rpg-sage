import type { Snowflake } from "@rsc-utils/core-utils";

let _testBotId: Snowflake;
export function setTestBotId(testBotId: Snowflake): void {
	_testBotId = testBotId;
}

export function getTestBotId(): Snowflake {
	return _testBotId;
}

export function isTestBotId(id?: Snowflake | null): id is Snowflake {
	return _testBotId && id ? _testBotId === id : false;
}