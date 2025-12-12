import type { StatBlockProcessor } from "@rsc-utils/dice-utils";
import { getAbilityScoreAndModifierD20 } from "../../utils/getAbilityScoreAndModifierD20.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { prepStat } from "../../utils/prepStat.js";
import { toModifier } from "../../utils/toModifier.js";
import { Ability } from "../lib/Ability.js";

function abilitiesToHtml(char: StatBlockProcessor): string | undefined {
	let hasStats = false;
	const stats = Ability.all().map(({ abbr, name }) => {
		const values = getAbilityScoreAndModifierD20(char.getString(name));
		if (values) {
			hasStats = true;
			return `<b>${abbr}</b> ${values.score} (${toModifier(values.modifier)})`;
		}
		return `<b>${abbr}</b> ?? (+?)`;
	});
	if (hasStats) {
		return stats.join(", ");
	}
	return undefined;
}

function acToHtml(char: StatBlockProcessor): string | undefined {
	const stat = char.getString("ac");
	return stat ? `<b>AC</b> ${stat}` : undefined;
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

function acSavesToHtml(char: StatBlockProcessor): string | undefined {
	const ac = acToHtml(char);
	const saves = savesToHtml(char);
	return ac && saves
		? `${ac}; ${saves}`
		: ac ?? saves;
}

function hpToHtml(char: StatBlockProcessor): string | undefined {
	const hpKey = char.getKey("hitPoints");
	const { val, valKey, valPipes, max, maxPipes, tmp, tmpKey, tmpPipes } = char.getNumbers(hpKey);

	if (tmp) {
		/** @todo this should probably simply be `${valKey}.tmp` */
		return char.processTemplate(`${valKey}.${tmpKey}`).value
			?? `<b>HP</b> ${prepStat(val, valPipes)}/${prepStat(max, maxPipes)}; <b>Temp HP</b> ${prepStat(tmp, tmpPipes)}`;
	}

	if (val || max) {
		return char.processTemplate(valKey ?? hpKey).value
			?? `<b>HP</b> ${prepStat(val, valPipes)}/${prepStat(max, maxPipes)}`;
	}

	return undefined;
}

function coinsToHtml(char: StatBlockProcessor): string | undefined {
	const raw = char.getString("currency.raw");
	if (raw) {
		const simple = char.getString("currency");
		if (raw !== simple) {
			return `<b>Coins</b> ${raw}  <i>(${simple})</i>`;
		}
		return `<b>Coins</b> ${raw}`;
	}
	return undefined;
}

export function statsToHtml(char: StatBlockProcessor): string[] {
	const out: (string | undefined)[] = [];
	out.push(abilitiesToHtml(char));
	out.push(acSavesToHtml(char));
	out.push(hpToHtml(char));
	out.push(coinsToHtml(char));
	return out.filter(s => s !== undefined) as string[];
}

/** @todo make the statsToHtml function return keys used that this function can validate against. */
export function isStatsKey(key: string): boolean {
	const lower = key.toLowerCase();
	return Ability.all().some(({ abbrKey, key }) => abbrKey === lower || key === lower)
		|| ["mod.fortitude", "fortitude", "fort", "mod.reflex", "reflex", "ref", "mod.will", "will"].includes(lower)
		|| ["ac", "hp", "maxhp", "hp.max", "temphp", "hp.temp", "hp.tmp"].includes(lower);
}