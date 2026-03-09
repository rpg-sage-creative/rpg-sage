import { parseSnowflake, parseUuid, type Snowflake } from "@rsc-utils/core-utils";
import { GameUserType } from "../enums/GameUserType.js";
import type { SageGameCoreOld } from "../SageGameCore.js";

type Ids = { userDid?:Snowflake; userId?:Snowflake; };
type Char = Ids & { lastMessages?:Ids[]; };

function _getUserId(core: Ids | undefined, idKey: keyof Ids): Snowflake | undefined {
	return parseSnowflake(core?.[idKey])
		?? parseUuid(core?.[idKey]) as Snowflake
		?? undefined;
}

function _findLastMessageUserId(core: Char | undefined, idKey: keyof Ids): Snowflake | undefined {
	return core?.lastMessages?.find(msg => _getUserId(msg, idKey))?.[idKey] ?? undefined;
}

/** check char object directly before looking through last messages */
function _findCharUserId(char: Char | undefined, idKey: keyof Ids): Snowflake | undefined {
	return _getUserId(char, idKey) ?? _findLastMessageUserId(char, idKey);
}

function _findCharsUserId(chars: Char[] | undefined, idKey: keyof Ids): Snowflake | undefined {
	if (chars) {
		for (const char of chars) {
			const userId = _findCharUserId(char, idKey);
			if (userId) return userId;
		}
	}
	return undefined;
}

/** checks char for userId, then last messages for userId, then char for userDid, then last messages for userDid */
export function findCharUserId(charCore: Char): Snowflake | undefined {
	return _findCharUserId(charCore, "userDid") ?? _findCharUserId(charCore, "userId");
}

/** looks for a gm before scanning npcs for userId/userDid */
export function findGameNpcUserId(gameCore: SageGameCoreOld): Snowflake | undefined {
	// get first gm id
	return gameCore.users?.find(u => u.type === GameUserType.GameMaster)?.did
	// get first npc with userDid
		?? _findCharsUserId(gameCore.nonPlayerCharacters, "userDid")
	// get first npc with userId
		?? _findCharsUserId(gameCore.nonPlayerCharacters, "userId");
}