import { Hemisphere, Season, TemperateSeason, TropicalSeason } from "./enums";

function flipSeasonHemisphere(season: Season): Season | undefined {
	switch (season) {
		case Season.Winter: return Season.Summer;
		case Season.Spring: return Season.Fall;
		case Season.Summer: return Season.Winter;
		case Season.Fall: return Season.Spring;
		case Season.Wet: return Season.Dry;
		case Season.Dry: return Season.Wet;
		default: return undefined;
	}
}

/** Returns the Meteorological season that corresponds with the current date in the Nothern hemisphere. */
export function getTemperateSeason(): TemperateSeason;

/** Returns the Meteorological season that corresponds with the given date in the Nothern hemisphere. */
export function getTemperateSeason(date: Date): TemperateSeason;

/** Returns the Meteorological season that corresponds with the current date in the given hemisphere. */
export function getTemperateSeason(hemisphere: Hemisphere): TemperateSeason;

/** Returns the Meteorological season that corresponds with the given date in the given hemisphere. */
export function getTemperateSeason(date: Date, hemisphere: Hemisphere): TemperateSeason;

export function getTemperateSeason(...args: (Date | Hemisphere)[]): TemperateSeason {
	const date = args.find(d => d instanceof Date) as Date ?? new Date();
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

	return flipSeasonHemisphere(season as number as Season) as number as TemperateSeason;
}

/** Returns the Meteorological season that corresponds with the current date in the Nothern hemisphere. */
export function getTropicalSeason(): TropicalSeason;

/** Returns the Meteorological season that corresponds with the given date in the Nothern hemisphere. */
export function getTropicalSeason(date: Date): TropicalSeason;

/** Returns the Meteorological season that corresponds with the current date in the given hemisphere. */
export function getTropicalSeason(hemisphere: Hemisphere): TropicalSeason;

/** Returns the Meteorological season that corresponds with the given date in the given hemisphere. */
export function getTropicalSeason(date: Date, hemisphere: Hemisphere): TropicalSeason;

export function getTropicalSeason(...args: (Date | Hemisphere)[]): TropicalSeason {
	const date = args.find(d => d instanceof Date) as Date ?? new Date();
	const season = [
		TropicalSeason.Dry, TropicalSeason.Dry, TropicalSeason.Dry, TropicalSeason.Dry,
		TropicalSeason.Wet, TropicalSeason.Wet, TropicalSeason.Wet, TropicalSeason.Wet, TropicalSeason.Wet, TropicalSeason.Wet,
		TropicalSeason.Dry, TropicalSeason.Dry
	][date.getMonth()];

	const hemisphere = args.find(arg => Hemisphere[arg as Hemisphere] !== undefined) as Hemisphere ?? Hemisphere.Northern;
	if (hemisphere === Hemisphere.Northern) {
		return season;
	}

	return flipSeasonHemisphere(season as number as Season) as number as TropicalSeason;
}
