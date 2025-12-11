import { numberOrUndefined } from "@rsc-utils/core-utils";
import type { StatBlockProcessor } from "@rsc-utils/game-utils";
import { Ability } from "../../d20/lib/Ability.js";
import { getAbilityScoreAndModifierD20 } from "../../utils/getAbilityScoreAndModifierD20.js";
import { toModifier } from "../../utils/toModifier.js";
import { Condition } from "../lib/Condition.js";

// hero point token: 🅗ⒽⒽ (1 of 3)

function abilitiesToHtml(char: StatBlockProcessor): string | undefined {
	let hasStats = false;
	const stats = Ability.all().map(({ abbr, name }) => {
		// P20 should be using only modifiers on 3 letter abilities: str=+1; but mod.strength=+1 is acceptable
		const abilityModifier = numberOrUndefined(char.getString(abbr) ?? char.getString(`mod.${name}`));
		if (abilityModifier !== undefined) {
			hasStats = true;
			return `<b>${abbr}</b> ${toModifier(abilityModifier)}`;
		}

		// in case they are old school or premaster: strength=12
		const abilityScoreValues = getAbilityScoreAndModifierD20(char.getString(name));
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

function acToHtml(char: StatBlockProcessor): string | undefined {
	const stat = char.getString("ac");
	return stat ? `<b>AC</b> ${stat}` : undefined;
	// const stat = char.getStat("ac");
	// if (stat) {
	// 	if (stat.processed) {
	// 		return `<b>AC</b> \`${stat.raw}\` *(${stat.value})*`;
	// 	}
	// 	return `<b>AC</b> ${stat.raw}`;
	// }
	// return undefined;
}

function savesToHtml(char: StatBlockProcessor): string | undefined {
	let hasSaves = false;
	const saves = [["Fortitude","Fort"], ["Reflex","Ref"], ["Willpower","Will"]].map(([saveName, saveCode]) => {
		const stat = char.getString(`mod.${saveName}`) ?? char.getString(saveCode) ?? char.getString(saveName);
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

function classDcToHtml(char: StatBlockProcessor): string | undefined {
	const stat = char.getString("classDC");
	return stat ? `<b>Class DC</b> ${stat}` : undefined;
}

function acSavesDcToHtml(char: StatBlockProcessor): string | undefined {
	const parts = [
		acToHtml(char),
		savesToHtml(char),
		classDcToHtml(char),
	];
	const existing = parts.filter(s => s);
	return existing.join("; ");
}

function hpToHtml(char: StatBlockProcessor): string | undefined {
	const { val:hp, valKey, max:maxHp, tmp:tempHp, tmpKey } = char.getNumbers("hitPoints");

	if (tempHp) {
		/** @todo this should probably simply be `${valKey}.tmp` */
		return char.processTemplate(`${valKey}.${tmpKey}`).value
			?? `<b>HP</b> ${hp ?? "??"}/${maxHp ?? "??"}; <b>Temp HP</b> ${tempHp ?? "0"}`;
	}

	if (hp || maxHp) {
		return char.processTemplate(valKey ?? char.getKey("hitPoints")).value
			?? `<b>HP</b> ${hp ?? "??"}/${maxHp ?? "??"}`;
	}

	return undefined;
}

function coinsToHtml(char: StatBlockProcessor): string | undefined {
	const raw = char.getString("currency.raw");
	if (raw) {
		const simple = char.getString("currency");
		if (raw !== simple) {
			return `<b>Coins</b> ${raw} <i>(${simple})</i>`;
		}
		return `<b>Coins</b> ${raw}`;
	}
	return undefined;
}


function conditionsToHtml(char: StatBlockProcessor): string | undefined {
	const conditions = char.getStringArray("conditions");
	if (conditions?.length) {
		return `<b>Conditions</b> ${conditions.join(", ")}`;
	}
	return undefined;
}

export function statsToHtml(char: StatBlockProcessor): string[] {
	const out: (string | undefined)[] = [];
	out.push(abilitiesToHtml(char));
	out.push(acSavesDcToHtml(char));
	out.push(hpToHtml(char));
	out.push(coinsToHtml(char));
	out.push(conditionsToHtml(char));
	return out.filter(s => s !== undefined) as string[];
}

/** @todo make the statsToHtml function return keys used that this function can validate against. */
export function isStatsKey(key: string): boolean {
	const lower = key.toLowerCase();
	return Ability.all().some(({ abbrKey, key }) => abbrKey === lower || key === lower)
		|| ["mod.fortitude", "fortitude", "fort", "mod.reflex", "reflex", "ref", "mod.will", "will"].includes(lower)
		|| ["ac", "hp", "maxhp", "hp.max", "temphp", "hp.temp", "hp.tmp"].includes(lower)
		|| !!Condition.isConditionKey(lower)
		;
}