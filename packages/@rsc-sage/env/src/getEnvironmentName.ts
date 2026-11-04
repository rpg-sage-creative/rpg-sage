import { getCodeName } from "./getCodeName.js";
import { codeNameToEnvironmentName } from "./internal/codeNameToEnvironmentName.js";
import type { EnvironmentName } from "./types.js";

let _environmentName: EnvironmentName;

/**
 * Derives the environment name from the code name.
 */
export function getEnvironmentName(): EnvironmentName {
	if (!_environmentName) {
		_environmentName = codeNameToEnvironmentName(getCodeName());
	}
	return _environmentName;
}
