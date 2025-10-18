import { numberOrUndefined, type KeyValueTrio } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../sage-lib/sage/model/GameCharacter.js";
import { checkStatBounds as checkStatBoundsP20 } from "./p20/lib/checkStatBounds.js";

/**
 * Checks the bounds of the given key/value pair.
 * ex: PF2/SF2 Dying (min 0, max 5)
 *
 * If the value is out of bounds, return the correct value.
 * If the value is acceptable, or we don't have a test for it, return undefined so that the calling logic knows to use the original value.
 */
export function checkStatBounds(character: GameCharacter, pair: KeyValueTrio<string, null>): string | undefined {
	const numberValue = numberOrUndefined(pair.value);

	// handle explicitly given min
	const minValue = character.getNumber(`min${pair.key}`);
	if (minValue !== undefined) {
		if (pair.value?.toLowerCase() === "min" || numberValue === undefined) return String(minValue);
		if (numberValue < minValue) return String(minValue);
	}

	// handle explicitly given max
	const maxValue = character.getNumber(`max${pair.key}`);
	if (maxValue) {
		if (pair.value?.toLowerCase() === "max") return String(maxValue);
		if (numberValue && numberValue > maxValue) return String(maxValue);
	}

	if (character.gameSystem?.isP20) return checkStatBoundsP20(character, pair);
	return undefined;
}