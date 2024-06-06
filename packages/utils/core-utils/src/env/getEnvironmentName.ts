import type { EnvironmentName } from "./EnvironmentName.js";
import { getCodeName } from "./getCodeName.js";
import { codeNameToEnvironmentName } from "./internal/codeNameToEnvironmentName.js";

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
