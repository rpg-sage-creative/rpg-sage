import { captureProcessExit } from "./console/captureProcessExit.js";
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