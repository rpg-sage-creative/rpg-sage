import { StatBlockProcessor } from "@rsc-utils/dice-utils";
import type { GameCharacter } from "../../../sage-lib/sage/model/GameCharacter.js";
import { getAbilityScoreAndModifierD20 } from "../../utils/getAbilityScoreAndModifierD20.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { toModifier } from "../../utils/toModifier.js";
import { Ability } from "../lib/Ability.js";

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
	const hp = char.getNumber("hp");
	const maxHp = char.getNumber("maxHp");
	const tempHp = char.getNumber("tempHp");

	if (tempHp) {
		return StatBlockProcessor.processTemplate(char, "hp.tempHp").value
			?? `<b>HP</b> ${hp ?? "??"}/${maxHp ?? "??"}; <b>Temp HP</b> ${tempHp ?? "0"}`;
	}

	if (hp || maxHp) {
		return StatBlockProcessor.processTemplate(char, "hp").value
			?? `<b>HP</b> ${hp ?? "??"}/${maxHp ?? "??"}`;
	}

	return undefined;
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

export function statsToHtml(char: GameCharacter): string[] {
	const out: (string | undefined)[] = [];
	out.push(abilitiesToHtml(char));
	out.push(acSavesToHtml(char));
	out.push(hpToHtml(char));
	out.push(coinsToHtml(char));
	return out.filter(s => s !== undefined) as string[];
}

export function isStatsKey(key: string): boolean {
	const lower = key.toLowerCase();
	return Ability.all().some(({ abbrKey, key }) => abbrKey === lower || key === lower)
		|| ["mod.fortitude", "fortitude", "fort", "mod.reflex", "reflex", "ref", "mod.will", "will"].includes(lower)
		|| ["ac", "hp", "maxhp"].includes(lower);
}