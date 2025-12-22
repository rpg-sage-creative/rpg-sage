import type { KeyValuePair } from "@rsc-utils/core-utils";
import { unpipe, type UnpipeResults } from "@rsc-utils/game-utils";
import type { GameCharacter } from "../../../sage-lib/sage/model/GameCharacter.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { Condition } from "./Condition.js";

/**
 * Checks the bounds of the given key/value pair.
 * ex: Bleeding (min 0) or HitPoints (min 0, max maxHp)
 *
 * If the value is out of bounds, return the correct value.
 * If the value is acceptable, or we don't have a test for it, return undefined so that the calling logic knows to use the original value.
 */
export function checkStatBounds(character: GameCharacter, pair: KeyValuePair<string, null>, pipeInfo?: UnpipeResults<any>): string | undefined {
	const keyLower = pair.key.toLowerCase();
	const { hasPipes, unpiped } = pipeInfo ?? unpipe(pair.value);
	const numberValue = numberOrUndefined(unpiped);
	const isZeroOrLess = !numberValue || numberValue < 0;

	const hpKeyLower = character.getKey("hitPoints").toLowerCase();
	if (keyLower === hpKeyLower) {

		// check min hp
		if (isZeroOrLess) return hasPipes ? "||0||" : "0";

		// check max hp
		// handled by generic checkStatBounds

		// return no change
		return undefined;
	}

	if (["tmp" + hpKeyLower, "temp" + hpKeyLower, hpKeyLower + ".tmp", hpKeyLower + ".temp"].includes(keyLower) && isZeroOrLess) {
		return "";
	}

	const staminaKeyLower = character.getKey("staminaPoints").toLowerCase();
	if (keyLower === staminaKeyLower) {

		// check min stamina
		if (isZeroOrLess) return hasPipes ? "||0||" : "0";

		// check max stamina
		// handled by generic checkStatBounds

		// return no change
		return undefined;
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