import { isDate } from "util/types";
import { Hemisphere } from "./Hemisphere.js";
import type { Season } from "./Season.js";
import { TemperateSeason } from "./TemperateSeason.js";
import { flipSeasonForHemisphere } from "./internal/flipSeasonForHemisphere.js";

/** Returns the Meteorological season that corresponds with the current date in the Nothern hemisphere. */
export function getTemperateSeason(): TemperateSeason;

/** Returns the Meteorological season that corresponds with the given date in the Nothern hemisphere. */
export function getTemperateSeason(date: Date): TemperateSeason;

/** Returns the Meteorological season that corresponds with the current date in the given hemisphere. */
export function getTemperateSeason(hemisphere: Hemisphere): TemperateSeason;

/** Returns the Meteorological season that corresponds with the given date in the given hemisphere. */
export function getTemperateSeason(date: Date, hemisphere: Hemisphere): TemperateSeason;

export function getTemperateSeason(...args: (Date | Hemisphere)[]): TemperateSeason {
	const date = args.find(isDate) ?? new Date();
	const season = [
		TemperateSeason.Winter, TemperateSeason.Winter,
		TemperateSeason.Spring, TemperateSeason.Spring, TemperateSeason.Spring,
		TemperateSeason.Summer, TemperateSeason.Summer, TemperateSeason.Summer,
		TemperateSeason.Fall, TemperateSeason.Fall, TemperateSeason.Fall,
		TemperateSeason.Winter
	][date.getMonth()];

	const hemisphere = args.find(arg => Hemisphere[arg as Hemisphere] !== undefined) as Hemisphere ?? Hemisphere.Northern;
	if (hemisphere === Hemisphere.Northern) {
		return season;
	}

	return flipSeasonForHemisphere(season as number as Season) as number as TemperateSeason;
}
