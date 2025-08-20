import type { GameCharacter } from "../../../sage-lib/sage/model/GameCharacter.js";
import { Ability } from "../../d20/lib/Ability.js";
import { processCharacterTemplate } from "../../processCharacterTemplate.js";
import { getAbilityScoreAndModifierD20 } from "../../utils/getAbilityScoreAndModifierD20.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { toModifier } from "../../utils/toModifier.js";

function abilitiesToHtml(char: GameCharacter): string | undefined {
	let hasStats = false;
	const stats = Ability.all().map(({ abbr, name }) => {
		const values = getAbilityScoreAndModifierD20(char.getStat(name));
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

function acToHtml(char: GameCharacter): string | undefined {
	const eac = char.getStat("eac");
	const kac = char.getStat("kac");
	if (eac || kac) return `<b>EAC</b> ${eac ?? "??"}, <b>KAC</b> ${kac ?? "??"}`;
	return undefined;
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
	let hasHealth = false;
	const out = ["Stamina", "HP", "Resolve"].map(label => {
		const value = char.getNumber(label);
		const maxValue = char.getNumber(`max${label}`);
		if (value || maxValue) {
			hasHealth = true;
		}
		return processCharacterTemplate(char, `${label}.template`).value
			?? `<b>${label}</b> ${value ?? "??"}/${maxValue ?? "??"}`;
	});

	if (hasHealth) {
		return out.join("; ");
	}

	return undefined;
}

function currencyToHtml(char: GameCharacter): string | undefined {
	const credits = char.getStat("credits");
	const upb = char.getStat("upb");
	if (credits || upb) {
		const out = [];
		if (credits) out.push(`<b>Credits</b> ${credits}`);
		if (upb) out.push(`<b>UPB</b> ${upb}`);
		return out.join("; ");
	}
	return undefined;
}

export function statsToHtml(char: GameCharacter): string[] {
	const out: (string | undefined)[] = [];
	out.push(abilitiesToHtml(char));
	out.push(acSavesToHtml(char));
	out.push(hpToHtml(char));
	out.push(currencyToHtml(char));
	return out.filter(s => s !== undefined) as string[];
}

export function isStatsKey(key: string): boolean {
	const lower = key.toLowerCase();
	return Ability.all().some(({ abbrKey, key }) => abbrKey === lower || key === lower)
		|| ["mod.fortitude", "fortitude", "fort", "mod.reflex", "reflex", "ref", "mod.will", "will"].includes(lower)
		|| ["eac", "kac", "hp", "maxhp", "stamina", "maxstamina", "resolve", "maxresolve"].includes(lower);
}