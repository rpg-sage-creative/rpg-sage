import { isNonNilSnowflake, isNonNilUuid, isSnowflake, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { CharId, CharModalAction, CharModalIndicator, CustomIdParts } from "./types.js";

export function createCustomId(args: Omit<CustomIdParts, "indicator">): string;
export function createCustomId(userId: Snowflake, charId: CharId, action: CharModalAction): string;
export function createCustomId(arg: Snowflake | Omit<CustomIdParts, "indicator">, charId?: CharId, action?: CharModalAction): string {
	let userId: string;
	if (typeof(arg) === "string") {
		userId = arg;
	}else {
		({ userId, charId, action } = arg);
	}
	return `CharModal|${userId}|${charId}|${action}`;
}

function isValidIndicator(indicator: string): indicator is CharModalIndicator {
	return indicator === "CharModal";
}

function isValidAction(action: string): action is CharModalAction {
	return /^(Show|Submit)(Names|Images|Stats)$/.test(action)
		|| /^(Save|Confirm|Cancel)$/.test(action)
		|| /^(Select)(Char)$/.test(action);
}

export function parseCustomId(customId: Optional<string>): CustomIdParts | undefined {
	const [indicator, userId, charId, action] = customId?.split("|") ?? [];
	if (isValidIndicator(indicator) && isNonNilSnowflake(userId) && (isSnowflake(charId) || isNonNilUuid(charId)) && isValidAction(action)) {
		return { indicator, userId, charId, action };
	}
	return undefined;
}
