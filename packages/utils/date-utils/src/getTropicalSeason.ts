import { isDate } from "util/types";
import { Hemisphere } from "./Hemisphere.js";
import type { Season } from "./Season.js";
import { TropicalSeason } from "./TropicalSeason.js";
import { flipSeasonForHemisphere } from "./internal/flipSeasonForHemisphere.js";

/** Returns the Meteorological season that corresponds with the current date in the Nothern hemisphere. */
export function getTropicalSeason(): TropicalSeason;

/** Returns the Meteorological season that corresponds with the given date in the Nothern hemisphere. */
export function getTropicalSeason(date: Date): TropicalSeason;

/** Returns the Meteorological season that corresponds with the current date in the given hemisphere. */
export function getTropicalSeason(hemisphere: Hemisphere): TropicalSeason;

/** Returns the Meteorological season that corresponds with the given date in the given hemisphere. */
export function getTropicalSeason(date: Date, hemisphere: Hemisphere): TropicalSeason;

export function getTropicalSeason(...args: (Date | Hemisphere)[]): TropicalSeason {
	const date = args.find(isDate) ?? new Date();
	const season = [
		TropicalSeason.Dry, TropicalSeason.Dry, TropicalSeason.Dry, TropicalSeason.Dry,
		TropicalSeason.Wet, TropicalSeason.Wet, TropicalSeason.Wet, TropicalSeason.Wet, TropicalSeason.Wet, TropicalSeason.Wet,
		TropicalSeason.Dry, TropicalSeason.Dry
	][date.getMonth()];

	const hemisphere = args.find(arg => Hemisphere[arg as Hemisphere] !== undefined) as Hemisphere ?? Hemisphere.Northern;
	if (hemisphere === Hemisphere.Northern) {
		return season;
	}

	return flipSeasonForHemisphere(season as number as Season) as number as TropicalSeason;
}
