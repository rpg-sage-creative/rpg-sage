import type { CharacterShell } from "../CharacterShell.js";
import type { GameCharacter } from "../GameCharacter.js";

/**
 * Some keys are special and we should avoid trying to find meta stats for them.
 * Ex: we don't need to find a .min or .max for displayName.template or hitPoints.bar.values.
 */
export function isMetaStatKey(key: string, lower = key.toLowerCase()): boolean {
	if (lower.endsWith(".min")) return true;
	if (lower.endsWith(".max")) return true;
	if (lower.endsWith(".tmp")) return true;
	/** @todo stop allowing temp */
	if (lower.endsWith(".temp")) return true;

	// templates
	if (lower.endsWith(".template")) return true;
	if (lower.endsWith(".template.title")) return true;

	// bars, dots, indexed
	if (lower.endsWith(".bar")) return true;
	if (lower.endsWith(".bar.values")) return true;
	if (lower.endsWith(".dots")) return true;
	if (lower.endsWith(".dots.values")) return true;
	if (lower.endsWith(".indexed")) return true;
	if (lower.endsWith(".indexed.values")) return true;
	return false;
}

/** @todo stop allowing temp */
/** In addition to returning "maxhp" for "hp", this returns "alt.maxhp" for "alt.hp" */
function getOldMetaKey(key: string, prefix: "min" | "max" | "tmp" | "temp"): string {
	const parts = key.split(".");
	const last = parts.pop();
	parts.push(prefix + last);
	return parts.join(".");
}

/** Reusable function to declutter getNumbers() */
export function getMetaStat(char: GameCharacter | CharacterShell, key: string, metaKey: "min" | "max" | "tmp") {
	// the old way adds {meta} to the beginning of the last key: hp >> maxhp OR alt.hp >> al.maxhp
	let metaValue = char.getStat(getOldMetaKey(key, metaKey), true);

	// the new way adds .{meta} to the end of the key: hp >> hp.max
	if (!metaValue.isDefined) {
		metaValue = char.getStat(key + "." + metaKey, true);
	}

	/** @todo stop allowing temp */
	// this allows for folks to use temp OR tmp
	if (!metaValue.isDefined && metaKey === "tmp") {
		// old way
		metaValue = char.getStat(getOldMetaKey(key, "temp"), true);
		// new way
		if (!metaValue.isDefined) {
			metaValue = char.getStat(key + ".temp", true);
		}
	}

	// finally return it
	return metaValue;
}