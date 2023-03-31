/** Represents the date related parts of a Date. */
export interface DateLike {
	getFullYear(): number;

	/** The month as a number between 0 and 11 (January to December). */
	getMonth(): number;

	/** The date as a number between 1 and 31. */
	getDate(): number;
}

/** A container for the date parts of a DateLike as strings. */
export type TDateStrings = {
	/** 4 digit year */
	year: string;

	/** 2 digit month */
	month: string;

	/** 2 digit day */
	day: string;

	/** yyyy-mm-dd */
	date: string;
};

/**
 * Returns a TDateStrings type for a new Date()
 */
export function getDateStrings(): TDateStrings;

/**
 * Returns a TDateStrings type for the given Date
 */
export function getDateStrings<T extends DateLike>(dateLike: T): TDateStrings;

export function getDateStrings(dateLike = new Date()): TDateStrings {
	const year = String(dateLike.getFullYear());
	const month = String(dateLike.getMonth() + 1).padStart(2, "0");
	const day = String(dateLike.getDate()).padStart(2, "0");
	const date = `${year}-${month}-${day}`;
	return { year, month, day, date };
}
