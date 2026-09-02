import type { RollData } from "../types/RollData.js";
import { markAsAboveThreshold } from "./markAsAboveThreshold.js";
import { markAsBelowThreshold } from "./markAsBelowThreshold.js";
import { markAsDropped } from "./markAsDropped.js";
import { markAsExploded } from "./markAsExploded.js";
import { markAsExplosion } from "./markAsExplosion.js";
import { markAsFixed } from "./markAsFixed.js";
import { markAsMax } from "./markAsMax.js";
import { markAsMin } from "./markAsMin.js";

export function markRollData(rollData: RollData): void {
	const hasThreshold = !!rollData.isAboveThreshold || !!rollData.isBelowThreshold;

	let text = String(rollData.threshold ?? rollData.value);

	// mark fixed only if not using threshold; we have a superscript f for that
	if (rollData.isFixed && !hasThreshold) {
		text = markAsFixed(text);
	}

	if (rollData.isExploded) {
		text = markAsExploded(text);
	}
	if (rollData.isExplosion) {
		text = markAsExplosion(text);
	}

	// you can be above or below the threshold, not both
	if (rollData.isAboveThreshold) {
		text = markAsAboveThreshold(rollData.value, text, rollData.isFixed);
	}else if (rollData.isBelowThreshold) {
		text = markAsBelowThreshold(rollData.value, text, rollData.isFixed);
	}

	// you can be max or min, not both
	if (rollData.isMax) {
		text = markAsMax(text);
	}else if (rollData.isMin) {
		text = markAsMin(text);
	}

	// any value can be dropped
	if (rollData.isDropped) {
		text = markAsDropped(text);
	}

	// save output
	rollData.text = text;
}