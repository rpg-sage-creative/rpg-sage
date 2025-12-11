import type { StatsCharacter } from "@rsc-utils/game-utils";

/** In addition to returning "maxhp" for "hp", this returns "alt.maxhp" for "alt.hp" */
function getOldMetaKey(key: string, prefix: "min" | "max" | "tmp" | "temp"): string {
	const parts = key.split(".");
	const last = parts.pop();
	parts.push(prefix + last);
	return parts.join(".");
}

/** Reusable function to declutter getNumbers() */
export function getMetaStat(char: StatsCharacter, key: string, metaKey: "min" | "max" | "tmp") {
	// the old way adds {meta} to the beginning of the last key: hp >> maxhp OR alt.hp >> al.maxhp
	let metaValue = char.getStat(getOldMetaKey(key, metaKey), true);

	// the new way adds .{meta} to the end of the key: hp >> hp.max
	if (!metaValue.isDefined) {
		metaValue = char.getStat(key + "." + metaKey, true);
	}

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