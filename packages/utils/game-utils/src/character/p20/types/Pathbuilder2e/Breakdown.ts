import type { Ability } from "./Ability.js";
import type { MapLevelledBoots } from "./MapLevelledBoots.js";

export type Breakdown = {
	ancestryFree: Capitalize<Ability>[];
	ancestryBoosts: Capitalize<Ability>[];
	ancestryFlaws: Capitalize<Ability>[];
	backgroundBoosts: Capitalize<Ability>[];
	classBoosts: Capitalize<Ability>[];
	mapLevelledBoosts: MapLevelledBoots;
};