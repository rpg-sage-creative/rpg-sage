import type { IJsonCleanRules } from "./types";

export const MaximumJsonCleanRules: IJsonCleanRules = {
	deleteFalse: true,
	deleteNull: true,
	deleteEmptyArray: true,
	deleteEmptyObject: true,
	deleteEmptyString: true,
	deleteUndefined: true,
	deleteZero: true,
	recursive: true
};
