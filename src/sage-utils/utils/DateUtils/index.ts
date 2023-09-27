import { HemisphereType, SeasonType, TemperateSeasonType, TropicalSeasonType } from "./enums";
import type { IDate, TDateStrings } from "./types";

/** Returns a TDateStrings type for a new Date() */
export function getDateStrings(): TDateStrings;
/** Returns a TDateStrings type for the given Date */
export function getDateStrings<T extends IDate>(date: T): TDateStrings;
export function getDateStrings(_date = new Date()): TDateStrings {
	const year = String(_date.getFullYear());
	const month = String(_date.getMonth() + 1).padStart(2, "0");
	const day = String(_date.getDate()).padStart(2, "0");
	const hours = String(_date.getHours()).padStart(2, "0");
	const minutes = String(_date.getMinutes()).padStart(2, "0");
	const seconds = String(_date.getSeconds()).padStart(2, "0");
	const milli = String(_date.getMilliseconds()).slice(0, 3).padEnd(3, "0");
	const date = `${year}-${month}-${day}`;
	const time = `${hours}:${minutes}:${seconds}.${milli}`;
	const dateTime = `${date} ${time}`;
	return {
		year, month, day,
		hours, minutes, seconds, milli,
		date, time, dateTime
	};
}

/** Returns the day of the year (1-365) */
export function getDayOfYear(date = new Date()): number {
	const oneJanDate = new Date(date.getFullYear(), 0, 1);
	return Math.ceil((date.getTime() - oneJanDate.getTime()) / 86400000);
}

/** Returns a date that represents midnight for the given date (or current if none given). */
export function getMidnight(date = new Date()): Date {
	const midnightDate = new Date(0);
	midnightDate.setUTCFullYear(date.getUTCFullYear());
	midnightDate.setUTCMonth(date.getUTCMonth());
	midnightDate.setUTCDate(date.getUTCDate());
	return midnightDate;
}

function flipSeasonHemisphere(season: SeasonType): SeasonType | undefined {
	switch (season) {
		case SeasonType.Winter: return SeasonType.Summer;
		case SeasonType.Spring: return SeasonType.Fall;
		case SeasonType.Summer: return SeasonType.Winter;
		case SeasonType.Fall: return SeasonType.Spring;
		case SeasonType.Wet: return SeasonType.Dry;
		case SeasonType.Dry: return SeasonType.Wet;
		default: return undefined;
	}
}

/** Returns the Meteorological season that corresponds with the current date in the Nothern hemisphere. */
export function getTemperateSeason(): TemperateSeasonType;
/** Returns the Meteorological season that corresponds with the given date in the Nothern hemisphere. */
export function getTemperateSeason(date: Date): TemperateSeasonType;
/** Returns the Meteorological season that corresponds with the current date in the given hemisphere. */
export function getTemperateSeason(hemisphere: HemisphereType): TemperateSeasonType;
/** Returns the Meteorological season that corresponds with the given date in the given hemisphere. */
export function getTemperateSeason(date: Date, hemisphere: HemisphereType): TemperateSeasonType;
export function getTemperateSeason(...args: (Date | HemisphereType)[]): TemperateSeasonType {
	const date = args.find(isDate) ?? new Date();
	const season = [
		TemperateSeasonType.Winter, TemperateSeasonType.Winter,
		TemperateSeasonType.Spring, TemperateSeasonType.Spring, TemperateSeasonType.Spring,
		TemperateSeasonType.Summer, TemperateSeasonType.Summer, TemperateSeasonType.Summer,
		TemperateSeasonType.Fall, TemperateSeasonType.Fall, TemperateSeasonType.Fall,
		TemperateSeasonType.Winter
	][date.getMonth()];

	const hemisphere = args.find(arg => HemisphereType[arg as HemisphereType] !== undefined) as HemisphereType ?? HemisphereType.Northern;
	if (hemisphere === HemisphereType.Northern) {
		return season;
	}

	return flipSeasonHemisphere(season as number as SeasonType) as number as TemperateSeasonType;
}

/** Returns the Meteorological season that corresponds with the current date in the Nothern hemisphere. */
export function getTropicalSeason(): TropicalSeasonType;
/** Returns the Meteorological season that corresponds with the given date in the Nothern hemisphere. */
export function getTropicalSeason(date: Date): TropicalSeasonType;
/** Returns the Meteorological season that corresponds with the current date in the given hemisphere. */
export function getTropicalSeason(hemisphere: HemisphereType): TropicalSeasonType;
/** Returns the Meteorological season that corresponds with the given date in the given hemisphere. */
export function getTropicalSeason(date: Date, hemisphere: HemisphereType): TropicalSeasonType;
export function getTropicalSeason(...args: (Date | HemisphereType)[]): TropicalSeasonType {
	const date = args.find(isDate) ?? new Date();
	const season = [
		TropicalSeasonType.Dry, TropicalSeasonType.Dry, TropicalSeasonType.Dry, TropicalSeasonType.Dry,
		TropicalSeasonType.Wet, TropicalSeasonType.Wet, TropicalSeasonType.Wet, TropicalSeasonType.Wet, TropicalSeasonType.Wet, TropicalSeasonType.Wet,
		TropicalSeasonType.Dry, TropicalSeasonType.Dry
	][date.getMonth()];

	const hemisphere = args.find(arg => HemisphereType[arg as HemisphereType] !== undefined) as HemisphereType ?? HemisphereType.Northern;
	if (hemisphere === HemisphereType.Northern) {
		return season;
	}

	return flipSeasonHemisphere(season as number as SeasonType) as number as TropicalSeasonType;
}

/** Returns true if the value is a date object. */
export function isDate(value: any): value is Date {
	return value instanceof Date;
}
