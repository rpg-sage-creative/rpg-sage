import { unpipe } from "@rsc-utils/dice-utils";
import type { GameCharacter } from "../sage-lib/sage/model/GameCharacter.js";
import type { TKeyValuePair } from "../sage-lib/sage/model/SageMessageArgs.js";
import { checkStatBounds as checkStatBoundsP20 } from "./p20/lib/checkStatBounds.js";
import { numberOrUndefined } from "./utils/numberOrUndefined.js";

/**
 * Checks the bounds of the given key/value pair.
 * ex: PF2/SF2 Dying (min 0, max 5)
 *
 * If the value is out of bounds, return the correct value.
 * If the value is acceptable, or we don't have a test for it, return undefined so that the calling logic knows to use the original value.
 */
export function checkStatBounds(character: GameCharacter, pair: TKeyValuePair): string | undefined {
	const pipeInfo = unpipe(pair.value);
	const numberValue = numberOrUndefined(pipeInfo.unpiped);

	const { min:minValue, max:maxValue, valPipes } = character.getNumbers(pair.key, { min:true, max:true, val:true });

	// ensures the corrected value has pipes if appropriate
	const ret = (value: number) => valPipes || pipeInfo.hasPipes ? `||${value}||` : String(value);

	// handle explicitly given min
	if (minValue !== undefined) {
		if (pair.value?.toLowerCase() === "min" || numberValue === undefined) return ret(minValue);
		if (numberValue < minValue) return ret(minValue);
	}

	// handle explicitly given max
	if (maxValue) {
		if (pair.value?.toLowerCase() === "max") return ret(maxValue);
		if (numberValue && numberValue > maxValue) return ret(maxValue);
	}

	if (character.gameSystem?.isP20) return checkStatBoundsP20(character, pair, pipeInfo);
	return undefined;
}