import { captureProcessExit } from "@rsc-utils/console-utils";
import { getBotCodeName } from "./getBotCodeName.js";

/**
 * Convenience function for:
 * captureProcessExit();
 * enableLogLevels(getEnvironmentName());
 * */
export function initializeConsoleUtilsByEnvironment() {
	captureProcessExit();
	getBotCodeName(true);
}