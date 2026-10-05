import { captureProcessExit } from "@rsc-utils/logger-utils";
import { getCodeName } from "./env/getCodeName.js";

/**
 * Convenience function for:
 * captureProcessExit();
 * enableLogLevels(getEnvironmentName());
 * */
export function initializeConsoleUtilsByEnvironment() {
	captureProcessExit();
	getCodeName(true);
}