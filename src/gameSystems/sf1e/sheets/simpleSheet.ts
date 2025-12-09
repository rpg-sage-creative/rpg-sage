import type { StatBlockProcessor } from "@rsc-utils/dice-utils";
import { Ability } from "../../d20/lib/Ability.js";
import { getAbilityScoreAndModifierD20 } from "../../utils/getAbilityScoreAndModifierD20.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { toModifier } from "../../utils/toModifier.js";
import { Condition } from "../lib/Condition.js";

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
	const eac = char.getString("eac");
	const kac = char.getString("kac");
	if (eac || kac) return `<b>EAC</b> ${eac ?? "??"}, <b>KAC</b> ${kac ?? "??"}`;
	return undefined;
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
	let hasHealth = false;
	const out = ["Stamina", "HP", "Resolve"].map(label => {
		const { val:value, max:maxValue } = char.getNumbers(label, { val:true, max:true });
		if (value || maxValue) {
			hasHealth = true;
			return char.processTemplate(label).value
				?? `<b>${label}</b> ${value ?? "??"}/${maxValue ?? "??"}`;
		}
		return undefined;
	}).filter(s => s);

	if (hasHealth) {
		return out.join("; ");
	}

	return undefined;
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
		|| ["mod.fortitude", "fortitude", "fort", "mod.reflex", "reflex", "ref", "mod.will", "will"].includes(lower)
		|| ["eac", "kac", "hp", "maxhp", "hp.max", "stamina", "maxstamina", "stamina.max", "resolve", "maxresolve", "resolve.max", "credits", "upbs"].includes(lower)
		|| !!Condition.isConditionKey(lower)
		;
}