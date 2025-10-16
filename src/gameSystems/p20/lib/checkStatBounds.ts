import type { GameCharacter } from "../../../sage-lib/sage/model/GameCharacter.js";
import type { TKeyValuePair } from "../../../sage-lib/sage/model/SageMessageArgs.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { Condition } from "./Condition.js";

/**
 * Checks the bounds of the given key/value pair.
 * ex: Dying (min 0, max 5) or HitPoints (min 0, max maxHp)
 *
 * If the value is out of bounds, return the correct value.
 * If the value is acceptable, or we don't have a test for it, return undefined so that the calling logic knows to use the original value.
 */
export function checkStatBounds(_character: GameCharacter, pair: TKeyValuePair): string | undefined {
	const keyLower = pair.key.toLowerCase();
	const numberValue = numberOrUndefined(pair.value);
	const isZeroOrLess = !numberValue || numberValue < 0;

	if (keyLower === "hp") {

		// check min hp
		if (isZeroOrLess) return "0";

		// check max hp
		// handled by generic checkStatBounds

		// return no change
		return undefined;
	}

	if (keyLower === "temphp" && isZeroOrLess) {
		return "";
	}

	// conditions have a min value of 0
	if (Condition.isValuedCondition(keyLower)) {
		if (isZeroOrLess) return "";
	}

	// toggled conditions are tracked using a 1 for on
	if (Condition.isToggledCondition(keyLower)) {
		return isZeroOrLess ? "" : "1";
	}

	return undefined;
}