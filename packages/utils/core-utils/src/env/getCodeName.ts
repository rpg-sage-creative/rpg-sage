import { enableLogLevels } from "../console/logLevels/enableLogLevels.js";
import type { Optional } from "../types/generics.js";
import type { CodeName } from "./CodeName.js";
import { codeNameToEnvironmentName } from "./internal/codeNameToEnvironmentName.js";
import { getFromProcess } from "./internal/getFromProcess.js";

/** Checks that the given string is a valid CodeName. */
function isValidCodeName(value: string): value is CodeName {
	return ["dev", "beta", "stable"].includes(value);
}

/** Checks that the given value is a string and is a valid CodeName. */
function isValid(value: Optional<string | number>): value is CodeName {
	return typeof(value) === "string" ? isValidCodeName(value) : false;
}

/** Checks that the gicen value is a string and a valid CodeName and enables the appropriate log levels. */
function enableLogLevelsIfValid(value: Optional<string | number>): value is CodeName {
	const stringValue = String(value);
	if (isValidCodeName(stringValue)) {
		enableLogLevels(codeNameToEnvironmentName(stringValue));
		return true;
	}
	return false;
}

let _codeName: CodeName;

/** Returns the codeName. */
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
