import { getFromProcessSafely, getIds, type Optional, type Snowflake } from "@rsc-utils/core-utils";

const ghostMode = getFromProcessSafely((val: unknown) => val === true, "ghostMode") === true;
function isGhostMode(): boolean {
	return ghostMode;
}

const ghostServerIds = getIds("ghostServer", true);
function isApprovedServerId(id: Optional<string>): id is Snowflake {
	return ghostServerIds.includes(id as Snowflake);
}

const ghostUserIds = getIds("ghostUser", true);
function isApprovedUserId(id: Optional<string>): id is Snowflake {
	return ghostUserIds.includes(id as Snowflake);
}

type HasIds = { id?:string; did?:string; }

/**
 * Tells the handlers whether or not to "ghost" and event.
 * To "ghost" an event is to accept it and test to see if we can process it, but then *NOT* process it.
 * This was added so that we could watch *LIVE* events come in through new code and try to debug points at which the code was locking up that didn't show in the logs ... all without breaking the currently functional and running build.
 * To "ghost" an event:
 *   1. "ghostMode" is true in the env.json
 *   2. server id (guildId) *NOT* in "ghostServerIds"
 *   3. user id *NOT* in "ghostUserIds"
 */
export function ghostEvent(server: Optional<HasIds|string>, user: Optional<HasIds|string>): boolean {
	// we only ghost when isApprovedOnly is on
	if (!isGhostMode()) return false;

	// no server or user is a ghost
	if (!server || !user) return true;

	// if server is not approved then ghost
	if (typeof(server) === "string") {
		if (!isApprovedServerId(server)) return true;
	}else {
		if (!isApprovedServerId(server.id) && !isApprovedServerId(server.did)) return true;
	}

	// if user is not approved then ghost
	if (typeof(user) === "string") {
		if (!isApprovedUserId(user)) return true;
	}else {
		if (!isApprovedUserId(user.id) && !isApprovedUserId(user.did)) return true;
	}

	// don't ghost
	return false;
}