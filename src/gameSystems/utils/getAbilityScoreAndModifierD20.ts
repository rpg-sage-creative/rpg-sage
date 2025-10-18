import { numberOrUndefined, type Optional } from "@rsc-utils/core-utils";
import { calcStatModifierD20 } from "./calcStatModifierD20.js";

export function getAbilityScoreAndModifierD20(value: Optional<string>) {
	const score = numberOrUndefined(value);
	if (score === undefined) return undefined;
	const modifier = calcStatModifierD20(score);
	return { score, modifier };
}