import type { TemperateSeason } from "./TemperateSeason.js";
import type { TropicalSeason } from "./TropicalSeason.js";

export interface HasSeasons {
	temperateSeason: TemperateSeason;
	temperateSeasonName: keyof typeof TemperateSeason;

	tropicalSeason: TropicalSeason
	tropicalSeasonName: keyof typeof TropicalSeason;
}