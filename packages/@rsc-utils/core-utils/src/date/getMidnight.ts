
/** Returns a date that represents midnight for the given date (or current if none given). */
export function getMidnight(): Date;

/** Returns a date that represents midnight for the given date (or current if none given). */
export function getMidnight(date: Date): Date;

export function getMidnight(dt = new Date()): Date {
	const midnightDate = new Date(0);
	midnightDate.setUTCFullYear(dt.getUTCFullYear());
	midnightDate.setUTCMonth(dt.getUTCMonth());
	midnightDate.setUTCDate(dt.getUTCDate());
	return midnightDate;
}