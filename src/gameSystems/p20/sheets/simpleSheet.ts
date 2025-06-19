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

function classDcToHtml(char: GameCharacter): string | undefined {
	const stat = char.getStat("classDC");
	return stat ? `<b>Class DC</b> ${stat}` : undefined;
}

function acSavesDcToHtml(char: GameCharacter): string | undefined {
	const parts = [
		acToHtml(char),
		savesToHtml(char),
		classDcToHtml(char),
	];
	const existing = parts.filter(s => s);
	return existing.join("; ");
}

function hpToHtml(char: GameCharacter): string | undefined {
	const tempHp = char.getStat("tempHp");
	const hp = char.getStat("hp");
	const maxHp = char.getStat("maxHp");
	return hp || maxHp || tempHp
		? `<b>HP</b> ${hp ?? "??"}/${maxHp ?? "??"}; <b>Temp HP</b> ${tempHp ?? "0"}`
		: undefined;
}

function coinsToHtml(char: GameCharacter): string | undefined {
	const raw = char.getStat("currency.raw");
	if (raw) {
		const simple = char.getStat("currency");
		if (raw !== simple) {
			return `<b>Coins</b> ${raw}  <i>(${simple})</i>`;
		}
		return `<b>Coins</b> ${raw}`;
	}
	return undefined;
}


function conditionsToHtml(char: GameCharacter): string | undefined {
	const conditions = char.getStat("conditions")?.split(/\s*,\s*/).filter(s => s);
	if (conditions?.length) {
		return `<b>Conditions</b> ${conditions.join(", ")}`;
	}
	return undefined;
}

export function statsToHtml(char: GameCharacter): string[] {
	const out: (string | undefined)[] = [];
	out.push(abilitiesToHtml(char));
	out.push(acSavesDcToHtml(char));
	out.push(hpToHtml(char));
	out.push(coinsToHtml(char));
	out.push(conditionsToHtml(char));
	return out.filter(s => s !== undefined) as string[];
}

export function isStatsKey(key: string): boolean {
	const lower = key.toLowerCase();
	return Ability.all().some(({ abbrKey, key }) => abbrKey === lower || key === lower)
		|| ["mod.fortitude", "fortitude", "fort", "mod.reflex", "reflex", "ref", "mod.will", "will"].includes(lower)
		|| ["ac", "hp", "maxhp", "temphp"].includes(lower)
		|| !!Condition.isConditionKey(lower)
		;
}