import type { MacroBase } from "../../types/index.js";
import { tagFailure } from "../utils/tagFailure.js";
import { isSimpleObject, isValidString } from "./index.js";

export function isMacroBase(macro: unknown): macro is MacroBase {
	if ((macro as any)?.dialog) tagFailure("warn")`macro with dialog: ${macro}`;
	if (isSimpleObject(macro)) {
		const keys = Object.keys(macro as {}).length;
		return (keys === 2 || keys === 3)
			&& isValidString(macro.name)
			&& isValidString(macro.dice)
			&& (isValidString(macro.category) || !("category" in macro));
	}
	return false;
}
