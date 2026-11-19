import { getEnumKeys } from "./getEnumKeys.js";
import { getEnumValues } from "./getEnumValues.js";
import { parseEnum } from "./parseEnum.js";

/** Provides functionality common to all TypeScript enum "objects", in the style of Object.keys/values. */
export const Enum = {
	keys: getEnumKeys,
	parse: parseEnum,
	values: getEnumValues
};
