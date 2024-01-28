import { enableLogLevels } from "@rsc-utils/console-utils";
import type { BotCodeName } from "./BotCodeName.js";
import { botCodeNameToEnvironmentName } from "./internal/botCodeNameToEnvironmentName.js";
import { getFromProcess } from "./internal/getFromProcess.js";

function isValidCodeName(value: string): value is BotCodeName {
	return ["dev", "beta", "stable"].includes(value);
}

function isValid(value: string | number | null | undefined): value is BotCodeName {
	return isValidCodeName(String(value));
}

function enableLogLevelsIfValid(value: string | number | null | undefined): value is BotCodeName {
	const stringValue = String(value);
	if (isValidCodeName(stringValue)) {
		enableLogLevels(botCodeNameToEnvironmentName(stringValue));
		return true;
	}
	return false;
}

let _botCodeName: BotCodeName;

/**
 * Returns the botCodeName.
 */
export function getBotCodeName(): BotCodeName;

/**
 * @internal
 * @private
 * Returns the botCodeName.
 * Registers the log levels for the environment name derived from the code name.
 */
export function getBotCodeName(registerLogLevels: true): BotCodeName;

export function getBotCodeName(registerLogLevels?: true): BotCodeName {
	if (!_botCodeName) {
		const test = registerLogLevels ? enableLogLevelsIfValid : isValid;
		_botCodeName = getFromProcess(test, "botCodeName", "NODE_ENV");
	}
	return _botCodeName;
}
