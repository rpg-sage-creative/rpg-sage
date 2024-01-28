import type { EnvironmentName } from "./EnvironmentName.js";
import { getBotCodeName } from "./getBotCodeName.js";
import { botCodeNameToEnvironmentName } from "./internal/botCodeNameToEnvironmentName.js";

let _environmentName: EnvironmentName;

/**
 * Derives the environment name from the bot code name.
 */
export function getEnvironmentName(): EnvironmentName {
	if (!_environmentName) {
		_environmentName = botCodeNameToEnvironmentName(getBotCodeName());
	}
	return _environmentName;
}
