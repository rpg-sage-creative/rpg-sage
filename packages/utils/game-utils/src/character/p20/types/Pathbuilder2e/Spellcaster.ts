import type { Ability } from "./Ability.js";
import type { Proficiency } from "./Proficiency.js";
import type { Spells } from "./Spells.js";
import type { Tradition } from "./Tradition.js";

export type Spellcaster = {
	/** "Cleric Font" | "Caster Arcane Sense" | "Wizard" | ... */
	name: string;
	magicTradition: Tradition;
	/** "prepared" | "spontaneous" */
	spellcastingType: string;
	ability: Ability;
	proficiency: Proficiency;
	focusPoints: number;
	innate: boolean;
	perDay: number[];
	spells: Spells[];
	prepared: Spells[];
	blendedSpells: [];
};