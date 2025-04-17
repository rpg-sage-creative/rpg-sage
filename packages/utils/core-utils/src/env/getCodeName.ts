import { enableLogLevels } from "../console/logLevels/enableLogLevels.js";
import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./getFromProcess.js";
import { codeNameToEnvironmentName } from "./internal/codeNameToEnvironmentName.js";
import type { CodeName } from "./types.js";

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
		const codeNameValidator = (value: Optional<string | number>): value is CodeName => {
			return ["dev", "beta", "stable"].includes(String(value));
		};

		if (registerLogLevels) {

			/** Checks that the gicen value is a string and a valid CodeName and enables the appropriate log levels. */
			const enableLogLevelsIfValid = (value: Optional<string | number>): value is CodeName => {
				if (codeNameValidator(value)) {
					enableLogLevels(codeNameToEnvironmentName(value));
					return true;
				}
				return false;
			};

			_codeName = getFromProcess(enableLogLevelsIfValid, "codeName", "NODE_ENV");

		}else {

			_codeName = getFromProcess(codeNameValidator, "codeName", "NODE_ENV");
		}
	}
	return _codeName;
}
