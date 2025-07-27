import type { Abilities } from "./Abilities.js";
import type { Ability } from "./Ability.js";
import type { AcTotal } from "./AcTotal.js";
import type { Armor } from "./Armor.js";
import type { Attributes } from "./Attributes.js";
import type { Equipment } from "./Equipment.js";
import type { EquipmentContainers } from "./EquipmentContainers.js";
import type { Feat } from "./Feat.js";
import type { Formula } from "./Formula.js";
import type { Lore } from "./Lore.js";
import type { Money } from "./Money.js";
import type { Pet } from "./Pet.js";
import type { Proficiencies } from "./Proficiencies.js";
import type { Size } from "./Size.js";
import type { SizeName } from "./SizeName.js";
import type { SpecificProficiencies } from "./SpecificProficiencies.js";
import type { Spellcaster } from "./Spellcaster.js";
import type { Weapon } from "./Weapon.js";

type DualClass = { dualClass:string | null; } | { dualClass:"string" | "null"; };

/** The character data. */
export type Character = DualClass & {
	name: string;
	class: string;
	// dualClass: string | NullableString;
	level: number;
	ancestry: string;
	heritage: string;
	background: string;
	alignment: string;
	gender: string;
	age: string;
	deity: string;
	size: Size;
	sizeName: SizeName;
	keyability: Ability;
	languages: string[];
	rituals: string[];
	resistances: [];
	inventorMods: [];
	attributes: Attributes;
	abilities: Abilities;
	proficiencies: Proficiencies;
	mods: {};
	feats: Feat[];
	specials: string[];
	lores: Lore[];
	equipmentContainers: EquipmentContainers;
	equipment: Equipment[];
	specificProficiencies: SpecificProficiencies;
	weapons: Weapon[];
	money: Money;
	armor: Armor[];
	spellCasters: Spellcaster[];
	focusPoints: number;
	focus: {
		/** Tradition */
		[key: string]: {
			/** Ability */
			[key: string]: {
				abilityBonus: number;
				proficiency: number;
				itemBonus: number;
				focusCantrips: string[];
				focusSpells: string[];
			};
		};
	}
	formula: Formula[];
	acTotal: AcTotal;
	pets: Pet[];
	familiars: [];
};