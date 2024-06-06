import type { CodeName } from "../CodeName.js";
import type { EnvironmentName } from "../EnvironmentName.js";

/** @internal */
export function codeNameToEnvironmentName(codeName: CodeName): EnvironmentName {
	switch(codeName) {
		case "dev":
			return "development";
		case "beta":
			return "test";
		case "stable":
			return "production";
	}
	throw new Error(`Invalid CodeName: ${codeName}`);
}