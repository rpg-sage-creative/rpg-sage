import type { GameSystem } from "@rsc-sage/types";
import type { Optional } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../sage-lib/sage/model/GameCharacter.js";
import type { TKeyValuePair } from "../sage-lib/sage/model/SageMessageArgs.js";
import { checkStatBounds as checkStatBoundsP20 } from "./p20/lib/checkStatBounds.js";

/**
 * Checks the bounds of the given key/value pair.
 * ex: PF2/SF2 Dying (min 0, max 5)
 *
 * If the value is out of bounds, return the correct value.
 * If the value is acceptable, or we don't have a test for it, return undefined so that the calling logic knows to use the original value.
 */
export function checkStatBounds(character: GameCharacter, gameSystem: Optional<GameSystem>, pair: TKeyValuePair): string | undefined {
	const { isP20 } = character.gameSystem ?? gameSystem ?? {};
	if (isP20) return checkStatBoundsP20(character, pair);
	return undefined;
}