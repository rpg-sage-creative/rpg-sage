import type { GameCharacter } from "../../../sage-lib/sage/model/GameCharacter.js";
import { Ability } from "../../d20/lib/Ability.js";
import { getAbilityScoreAndModifierD20 } from "../../utils/getAbilityScoreAndModifierD20.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { toModifier } from "../../utils/toModifier.js";
import { Condition } from "../lib/Condition.js";

function abilitiesToHtml(char: GameCharacter): string | undefined {
	let hasStats = false;
	const stats = Ability.all().map(({ abbr, name }) => {
		// P20 should be using only modifiers on 3 letter abilities: str=+1; but mod.strength=+1 is acceptable
		const abilityModifier = numberOrUndefined(char.getStat(abbr) ?? char.getStat(`mod.${name}`));
		if (abilityModifier !== undefined) {
			hasStats = true;
			return `<b>${abbr}</b> ${toModifier(abilityModifier)}`;
		}

		// in case they are old school or premaster: strength=12
		const abilityScoreValues = getAbilityScoreAndModifierD20(char.getStat(name));
		if (abilityScoreValues) {
			hasStats = true;
			return `<b>${abbr}</b> ${toModifier(abilityScoreValues.modifier)}`;
		}

		return `<b>${abbr}</b> +?`;
	});
	if (hasStats) {
		return stats.join(", ");
	}
	return undefined;
}

function acToHtml(char: GameCharacter): string | undefined {
	const stat = char.getStat("ac");
	return stat ? `<b>AC</b> ${stat}` : undefined;
}

function savesToHtml(char: GameCharacter): string | undefined {
	let hasSaves = false;
	const saves = [["Fortitude","Fort"], ["Reflex","Ref"], ["Willpower","Will"]].map(([saveName, saveCode]) => {
		const stat = char.getStat(`mod.${saveName}`) ?? char.getStat(saveCode) ?? char.getStat(saveName);
		const value = numberOrUndefined(stat);
		if (value !== undefined) {
			hasSaves = true;
			return `<b>${saveCode}</b> ${toModifier(value)}`;
		}
		return `<b>${saveCode}</b> +?`;
	});
	if (hasSaves) {
		return saves.join(", ");
	}
	return undefined;
}

function acSavesToHtml(char: GameCharacter): string | undefined {
	const ac = acToHtml(char);
	const saves = savesToHtml(char);
	return ac && saves
		? `${ac}; ${saves}`
		: ac ?? saves;
}

function hpToHtml(char: GameCharacter): string | undefined {
	const hp = char.getStat("hp");
	const maxHp = char.getStat("maxHp");
	return hp || maxHp
		? `<b>HP</b> ${hp ?? "??"}/${maxHp ?? "??"}`
		: undefined;
}

function conditionsToHtml(char: GameCharacter): string | undefined {
	const conditions = char.getConditions();
	if (conditions.length) {
		return conditions.join(", ");
	}
	return undefined;
}

export function statsToHtml(char: GameCharacter): string[] {
	const out: (string | undefined)[] = [];
	out.push(abilitiesToHtml(char));
	out.push(acSavesToHtml(char));
	out.push(hpToHtml(char));
	out.push(conditionsToHtml(char));
	return out.filter(s => s !== undefined) as string[];
}

export function isStatsKey(key: string): boolean {
	const lower = key.toLowerCase();
	return Ability.all().some(({ abbrKey, key }) => abbrKey === lower || key === lower)
		|| ["mod.fortitude", "fortitude", "fort", "mod.reflex", "reflex", "ref", "mod.will", "will"].includes(lower)
		|| ["ac", "hp", "maxhp"].includes(lower)
		|| Condition.getToggledConditions().includes(lower)
		|| Condition.getValuedConditions().includes(lower)
		;
}