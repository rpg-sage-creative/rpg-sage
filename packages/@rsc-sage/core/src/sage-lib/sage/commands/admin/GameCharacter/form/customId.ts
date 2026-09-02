import { isNonNilSnowflake, isNonNilUuid, isSnowflake, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { CharId, CharModalAction, CharModalIndicator, CustomIdParts } from "./types.js";

export function createCustomId(args: Omit<CustomIdParts, "indicator">): string;
export function createCustomId(userId: Snowflake, charId: CharId, compId: CharId, action: CharModalAction): string;
export function createCustomId(arg: Snowflake | Omit<CustomIdParts, "indicator">, charId?: CharId, compId?: CharId, action?: CharModalAction): string {
	let userId: string;
	if (typeof(arg) === "string") {
		userId = arg;
	}else {
		({ userId, charId, compId, action } = arg);
	}
	return `CharModal|${userId}|${charId}|${compId}|${action}`;
}

function isValidIndicator(indicator: string): indicator is CharModalIndicator {
	return indicator === "CharModal";
}

function isValidAction(action: string): action is CharModalAction {
	return /^(Show|Submit)(Names|Images|Stats)$/.test(action)
		|| /^(Save|Confirm|Cancel)$/.test(action)
		|| /^(Select)(Char|Comp)$/.test(action);
}

export function parseCustomId(customId: Optional<string>): CustomIdParts | undefined {
	const [indicator, userId, charId, compId, action] = customId?.split("|") ?? [];
	if (isValidIndicator(indicator)
		&& isNonNilSnowflake(userId)
		&& (isSnowflake(charId) || isNonNilUuid(charId))
		&& (isSnowflake(compId) || isNonNilUuid(compId))
		&& isValidAction(action)) {
		return { indicator, userId, charId, compId, action };
	}
	return undefined;
}
