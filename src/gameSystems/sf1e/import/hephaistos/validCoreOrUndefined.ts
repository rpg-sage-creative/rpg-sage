import { isNotBlank } from "@rsc-utils/core-utils";
import type { HephaistosCharacterCoreSF1e } from "../types.js";
import { isSimpleObject } from "@rsc-sage/data-layer";

function isValidCore(json: unknown): json is HephaistosCharacterCoreSF1e {
	if (isSimpleObject(json)) {
		return typeof(json.version?.major) === "number"
			&& typeof(json.version?.minor) === "number"
			&& json.type === "character"
			&& isNotBlank(json.name)
			&& isSimpleObject(json.conditions)
			&& isSimpleObject(json.abilityScores)
			&& Array.isArray(json.skills)
			&& isSimpleObject(json.vitals)
			&& isSimpleObject(json.speed)
			&& isSimpleObject(json.initiative)
			&& isSimpleObject(json.armorClass)
			&& isSimpleObject(json.saves)
			;
	}
	return false;
}

export function validCoreOrUndefined(json: unknown): HephaistosCharacterCoreSF1e | undefined {
	return isValidCore(json) ? json : undefined;
}