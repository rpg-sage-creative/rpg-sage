import type { Month } from "./enums";

/** Returns the day of the year (1-365) */
export function getDayOfYear(date = new Date()): number {
	const oneJanDate = new Date(date.getFullYear(), 0, 1);
	return Math.ceil((date.getTime() - oneJanDate.getTime()) / 86400000);
}

/** Returns the number of days in the given month. */
export function getDaysInMonth(month: Month): number {
	return getDaysPerMonth()[month];
}

/** Returns an array of days per month. */
export function getDaysPerMonth(): number[] {
	return [
		31, /* January */
		28, /* February */
		31, /* March */
		30, /* April */
		31, /* May */
		30, /* June */
		31, /* July */
		31, /* August */
		30, /* September */
		31, /* October */
		30, /* November */
		31  /* December */
	];
}

/** Returns a date that represents midnight for the given date (or current if none given). */
export function getMidnight(date = new Date()): Date {
	const midnightDate = new Date(0);
	midnightDate.setUTCFullYear(date.getUTCFullYear());
	midnightDate.setUTCMonth(date.getUTCMonth());
	midnightDate.setUTCDate(date.getUTCDate());
	return midnightDate;
}
