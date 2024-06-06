import { enableLogLevels } from "../console/logLevels/enableLogLevels.js";
import { CodeName } from "./CodeName.js";
import { codeNameToEnvironmentName } from "./internal/codeNameToEnvironmentName.js";
import { getFromProcess } from "./internal/getFromProcess.js";

function isValidCodeName(value: string): value is CodeName {
	return ["dev", "beta", "stable"].includes(value);
}

function isValid(value: string | number | null | undefined): value is CodeName {
	return isValidCodeName(String(value));
}

function enableLogLevelsIfValid(value: string | number | null | undefined): value is CodeName {
	const stringValue = String(value);
	if (isValidCodeName(stringValue)) {
		enableLogLevels(codeNameToEnvironmentName(stringValue));
		return true;
	}
	return false;
}

let _codeName: CodeName;

/**
 * Returns the codeName.
 */
export function getCodeName(): CodeName;

/**
 * @internal
 * Returns the codeName.
 * Registers the log levels for the environment name derived from the code name.
 */
export function getCodeName(registerLogLevels: true): CodeName;

export function getCodeName(registerLogLevels?: true): CodeName {
	if (!_codeName) {
		const test = registerLogLevels ? enableLogLevelsIfValid : isValid;
		_codeName = getFromProcess(test, "codeName", "NODE_ENV");
	}
	return _codeName;
}
