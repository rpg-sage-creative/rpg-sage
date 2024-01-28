import type { BotCodeName } from "../BotCodeName.js";
import type { EnvironmentName } from "../EnvironmentName.js";

/**
 * @internal
 * @private
 */
export function botCodeNameToEnvironmentName(botCodeName: BotCodeName): EnvironmentName {
	switch(botCodeName) {
		case "dev":
			return "development";
		case "beta":
			return "test";
		case "stable":
			return "production";
	}
	throw new Error(`Invalid BotCodeName: ${botCodeName}`);
}