import type { GameSystem } from "@rsc-sage/types";
import type { Optional } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../sage-lib/sage/model/GameCharacter.js";
import { Condition as ConditionP20 } from "./p20/lib/Condition.js";
import { Condition as ConditionSF1e } from "./sf1e/lib/Condition.js";

function getConditionClass(gameSystem: Optional<GameSystem>): typeof ConditionP20 | typeof ConditionSF1e | undefined {
	if (gameSystem?.isP20) return ConditionP20;
	if (gameSystem?.code === "SF1e") return ConditionSF1e;
	return undefined;
}

export abstract class Condition {

	public static getCharacterConditions(char: GameCharacter): string | undefined {
		const Condition = getConditionClass(char.gameSystem);
		if (!Condition) return undefined;

		const conditions: string[] = [];

		Condition.ToggledConditions.forEach(condition => {
			if (char.getString(condition) !== undefined) {
				const riders = Condition.getConditionRiders(condition as any); // case type to narrow down to specific Condition class
				const riderText = riders.length ? ` (${riders.join(", ")})` : ``;
				conditions.push(condition + riderText);
			}
		});

		Condition.ValuedConditions.forEach(condition => {
			const value = char.getString(condition);
			if (value !== undefined) {
				conditions.push(`${condition} ${value}`);
			}
		});

		conditions.sort();

		return conditions.join(", ");
	}

	public static getToggledConditions(gameSystem: Optional<GameSystem>): readonly string[] {
		const Condition = getConditionClass(gameSystem);
		if (!Condition) return [];
		return Condition.ToggledConditions;
	}

	public static getValuedConditions(gameSystem: Optional<GameSystem>): readonly string[] {
		const Condition = getConditionClass(gameSystem);
		if (!Condition) return [];
		return Condition.ValuedConditions;
	}

	public static hasConditions(gameSystem: Optional<GameSystem>): gameSystem is GameSystem {
		return getConditionClass(gameSystem) !== undefined;
	}

	public static isConditionKey(gameSystem: Optional<GameSystem>, condition: string): "valued" | "toggled" | false;
	public static isConditionKey(gameSystem: Optional<GameSystem>, condition: string, which?: "valued" | "toggled"): boolean;
	public static isConditionKey(gameSystem: Optional<GameSystem>, condition: string, which?: "valued" | "toggled"): "valued" | "toggled" | boolean {
		const Condition = getConditionClass(gameSystem);
		if (!Condition) return false;

		const lower = condition.toLowerCase();

		// check valued
		const checkValued = !which || which == "valued";
		if (checkValued && Condition.isValuedCondition(lower)) {
			return which ? true : "valued";
		}

		// check toggled
		const checkToggled = !which || which === "toggled";
		if (checkToggled && Condition.isToggledCondition(lower)) {
			return which ? true : "toggled";
		}

		return false;
	}

}