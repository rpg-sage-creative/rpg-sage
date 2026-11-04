import type { Optional } from "@rsc-utils/type-utils";
import { getFromProcess } from "./getFromProcess.js";
import type { CodeName, ValidatorArg } from "./types.js";

let _codeName: CodeName;

/** Returns the codeName. */
export function getCodeName(): CodeName {
	if (!_codeName) {
		const codeNameValidator = (value: Optional<ValidatorArg>): value is CodeName => {
			return ["dev", "beta", "stable"].includes(value as string);
		};

		_codeName = getFromProcess(codeNameValidator, "codeName", "NODE_ENV");
	}
	return _codeName;
}
