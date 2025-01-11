import { isUrl } from "@rsc-utils/io-utils";
import { unwrap } from "@rsc-utils/string-utils";
import { getBasicDiceRegex } from "../../../../../sage-dice/getBasicDiceRegex.js";
import { isMath } from "../../dice/isMath.js";
import { isRandomItem } from "../../dice/isRandomItem.js";
import { parseTable } from "../../dice/parseTable.js";
import type { MacroType } from "./HasMacros.js";

export function getMacroType(value: string): MacroType {
	if (isUrl(unwrap(value, "[]"))) {
		return "tableUrl";
	}
	if (parseTable(value)) {
		return "table";
	}
	if (isRandomItem(value) && !getBasicDiceRegex().test(value)) {
		return "items";
	}
	if (isMath(value)) {
		return "math";
	}
	return "dice";
}