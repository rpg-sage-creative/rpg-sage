import type { TCore, TEntity, Pf2Tools } from "../../sage-pf2e";
import { findAndRemove, labelToKey, parseBody, parseSource, split, splitAndCapitalize } from "./common.mjs";
import type { TSpellHeighten } from "../../sage-pf2e/model/Spell";
// import utils from "sage-utils";

/*
{
		"name": "Magic Missile",
		"level": 1,
		"pfs": "standard",
		"traits": "evocation,force",
		"traditions": "arcane,occult",
		"cast": "s,v",
		"actions": 1,
		"max": 3,
		"range": 120,
		"source": "Core Rulebook pg. 349 2.0",
		"src": "https://2e.aonprd.com/Spells.aspx?ID=180",
		"aon": "spells180",
		"type": "spell",
		"body": "**Targets** 1 creature\n\n- - -\n\nYou send a dart of force streaking toward a creature that you can see. It automatically hits and deals 1d4+1 force damage. For each additional action you use when Casting the Spell, increase the number of missiles you shoot by one, to a maximum of three missiles for 3 actions. You choose the target for each missile individually. If you shoot more than one missile at the same target, combine the damage before applying bonuses or penalties to damage, resistances, weaknesses, and so forth.\n- - -\n**Heightened (+2)** You shoot one additional missile with each action you spend.",
		"hash": "vkdWMQxW"
	},
	{
		"aonId": 180,
		"name": "Magic Missile",
		"description": "Pelt creatures with unerring bolts of magical force.",
		"cast": "[A] to [A][A][A]",
		"components": [ "somatic", "verbal" ],
		"details": [
			"You send a dart of force streaking toward a creature that you can see. It automatically hits and deals 1d4+1 force damage. For each additional action you use when Casting the Spell, increase the number of missiles you shoot by one, to a maximum of three missiles for 3 actions. You choose the target for each missile individually. If you shoot more than one missile at the same target, combine the damage before applying bonuses or penalties to damage, resistances, weaknesses, and so forth."
		],
		"heightened": [
			{ "change": "You shoot one additional missile with each action you spend.", "bump": 2 }
		],
		"level": 1,
		"objectType": "Spell",
		"page": 349,
		"range": "120 feet",
		"source": "PZO2101",
		"targets": "1 creature",
		"traditions": [ "arcane", "occult" ],
		"traits": [ "Evocation", "Force" ],
		"focus": false,
		"id": "eb8828d7-daea-48df-bf97-46084320b489"
	}
*/

type TSpellComponent = "focus" | "material" | "somatic" | "verbal";
function components(value?: string): TSpellComponent[] | undefined {
	return value?.split(",").map(c =>
		c === "s" ? "somatic"
		: c === "v" ? "verbal"
		: c === "m" ? "material"
		: c === "f" ? "focus"
		: undefined) as TSpellComponent[];
}
function range(value?: number | string): string | undefined {
	return typeof(value) === "string" ? value
		: typeof(value) === "number" ? `${value} feet`
		: undefined;
}
function parseHeightened(lines: string[]): TSpellHeighten[] | undefined {
	const filtered = lines
		.map((line, index) => { return { line, index, bool:String(line).startsWith(`**Heighten`) }; })
		.filter(info => info.bool);
	if (filtered.length) {
		const cleaned = filtered.map(({ line }) => {
			const plus = line.match(/^\*\*Heightened\s*\(\+(\d+)\)\*\*\s*(.*?)$/);
			if (plus) {
				return { bump:plus[1], change:plus[2] };
			}
			const level = line.match(/^\*\*Heightened\s*\((\d+)(?:st|nd|rd|th)\)\*\*\s*(.*?)$/);
			if (level) {
				return { level:+level[1], change:level[2] };
			}
			// const as = line.match(/^\*\*Heightened\s*\(\+(\d+)(?:st|nd|rd|th)\)\*\*\s*(.*?)$/);
			return undefined;
		});
		filtered.reverse().forEach(info => lines.splice(info.index, 1));
		return cleaned.filter(o => o) as TSpellHeighten[];
	}
	return undefined;
}
function parseCast(lines: string[]): string {
	const value = findAndRemove(lines, "Cast");
	if (value !== undefined) {
		const actions = +value;
		const array = new Array(actions);
		array.fill("[A]", 0, actions);
		return array.join("");
	}
	return undefined!;
}
export function parseSpell(pf2t: Pf2Tools.Pf2ToolsDataCore): TCore<"Spell"> {
	const source = parseSource(pf2t.source);
	const parsedBody = parseBody<TEntity<"Spell">>(pf2t.body);
	const cast = parseCast(parsedBody.details as string[]);
	const heightened = parseHeightened(parsedBody.details as string[]);
	["Area", "Duration", "Targets"].forEach(label => {
		const value = findAndRemove(parsedBody.details as string[], label);
		(parsedBody as any)[labelToKey(label)] = value;
	});
	return {
		affliction: undefined!,
		aonId: +pf2t.aon.match(/(\d+)$/)![1],
		aonTraitId: undefined!,
		archetype: pf2t.archetype,
		area: parsedBody.area,
		cast: cast,
		components: components(pf2t.cast),
		cost: undefined!,
		creature: undefined!,
		// criticalFailure: undefined!,
		// criticalSuccess: undefined!,
		description: undefined!,
		details: parsedBody.details?.filter(d => d && d !== "- - -"),
		domain: undefined!,
		duration: parsedBody.duration,
		// failure: undefined!,
		focus: false,
		// followUp: undefined!,
		heightened: heightened,
		heightenedAs: undefined!,
		id: undefined!,
		level: pf2t.level,
		mystery: undefined!,
		name: pf2t.name,
		objectType: "Spell",
		page: source?.page,
		// pages: undefined!,
		pf2tHash: pf2t.hash,
		previousId: undefined!,
		range: range(pf2t.range),
		rarity: undefined!,
		reaction: undefined!,
		requirements: undefined!,
		savingThrow: parsedBody.savingThrow,
		source: source?.source?.code!,
		// sources: undefined!,
		// success: undefined!,
		targets: parsedBody.targets,
		traditions: split(pf2t.traditions)!,
		traits: splitAndCapitalize(pf2t.traits),
		trigger: undefined!,
		// url: undefined!,
		version: undefined!
	};
}