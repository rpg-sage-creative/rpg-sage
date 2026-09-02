import type { StatBlockProcessor } from "@rsc-utils/game-utils";
import { Ability } from "../../d20/lib/Ability.js";
import { SavingThrow } from "../../d20/lib/SavingThrow.js";
import { calcStatModifierD20 } from "../../utils/calcStatModifierD20.js";
import { prepStat } from "../../utils/prepStat.js";
import { toModifier } from "../../utils/toModifier.js";
import { Condition } from "../lib/Condition.js";

function getNumbers(char: StatBlockProcessor, ...keys: string[]) {
	for (const key of keys) {
		const numbers = char.getNumbers(key, { val:true });
		if (numbers.valDefined) return numbers;
	}
	return { isEmpty:true };
}

function abilitiesToHtml(char: StatBlockProcessor): string | undefined {
	let hasStats = false;
	const stats = Ability.all().map(({ abbr, name }) => {
		const score = char.getNumbers(name);
		if (score.valDefined) {
			hasStats = true;
			return `<b>${abbr}</b> ${prepStat(toModifier(calcStatModifierD20(score.val)), score.valPipes)}`;
		}

		return `<b>${abbr}</b> ?? (+?)`;
	});
	if (hasStats) {
		return stats.join(", ");
	}
	return undefined;
}

function acToHtml(char: StatBlockProcessor): string | undefined {
	const eac = char.getString("eac");
	const kac = char.getString("kac");
	if (eac || kac) return `<b>EAC</b> ${eac ?? "??"}, <b>KAC</b> ${kac ?? "??"}`;
	return undefined;
}

function savesToHtml(char: StatBlockProcessor): string | undefined {
	let hasSaves = false;
	const saves = SavingThrow.all().map(({ abbr, name }) => {
		const modifier = getNumbers(char, `mod.${name}`, abbr, name);
		if (modifier.valDefined) {
			hasSaves = true;
			return `<b>${abbr}</b> ${prepStat(toModifier(modifier.val!), modifier.hasPipes)}`;
		}
		return `<b>${abbr}</b> +?`;
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
	const out: string[] = [];

	const hitPoints = char.getNumbers(char.getKey("hitPoints"));
	const staminaPoints = char.getNumbers(char.getKey("staminaPoints"));
	const resolvePoints = char.getNumbers(char.getKey("resolvePoints"));

	if (hitPoints.tmpDefined) {
		out.push(
			char.processTemplate(hitPoints.tmpKey!).value
				?? `<b>Temp HP</b> ${prepStat(hitPoints.tmp, hitPoints.tmpPipes)}`
		);
	}
	if (staminaPoints.valDefined || staminaPoints.maxDefined) {
		out.push(
			char.processTemplate(staminaPoints.valKey!).value
				?? `<b>Stamina</b> ${prepStat(staminaPoints.val, staminaPoints.valPipes)}/${prepStat(staminaPoints.max, staminaPoints.maxPipes)}`
		);
	}
	if (hitPoints.valDefined || hitPoints.maxDefined) {
		out.push(
			char.processTemplate(hitPoints.valKey!).value
				?? `<b>HP</b> ${prepStat(hitPoints.val, hitPoints.valPipes)}/${prepStat(hitPoints.max, hitPoints.maxPipes)}`
		);
	}
	if (resolvePoints.valDefined || resolvePoints.maxDefined) {
		out.push(
			char.processTemplate(resolvePoints.valKey!).value
				?? `<b>Resolve</b> ${prepStat(resolvePoints.val, resolvePoints.valPipes)}/${prepStat(resolvePoints.max, resolvePoints.maxPipes)}`
		);
	}

	return out.length
		? out.join("; ")
		: undefined;
}

function currencyToHtml(char: StatBlockProcessor): string | undefined {
	const credits = char.getString("credits");
	const upbs = char.getString("upbs");
	if (credits || upbs) {
		const out = [];
		if (credits) out.push(`<b>Credits</b> ${credits}`);
		if (upbs) out.push(`<b>UPBs</b> ${upbs}`);
		return out.join("; ");
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
	out.push(acSavesToHtml(char));
	out.push(hpToHtml(char));
	out.push(currencyToHtml(char));
	out.push(conditionsToHtml(char));
	return out.filter(s => s !== undefined) as string[];
}

/** @todo make the statsToHtml function return keys used that this function can validate against. */
export function isStatsKey(key: string): boolean {
	const lower = key.toLowerCase();
	return Ability.all().some(({ abbrKey, key }) => abbrKey === lower || key === lower)
		|| SavingThrow.all().some(({ abbrKey, key }) => abbrKey === lower || key === lower || `mod.${key}` === lower)
		|| ["eac", "kac", "hp", "maxhp", "hp.max", "stamina", "maxstamina", "stamina.max", "resolve", "maxresolve", "resolve.max", "credits", "upbs"].includes(lower)
		|| !!Condition.isConditionKey(lower)
		;
}