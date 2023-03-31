/** Represents the time related parts of a Date. */
export interface TimeLike {
	/** A number from 0 to 23 (midnight to 11pm) that specifies the hour. */
	getHours(): number;

	/** A number from 0 to 59 that specifies the minutes. */
	getMinutes(): number;

	/** A number from 0 to 59 that specifies the seconds. */
	getSeconds(): number;

	/** A number from 0 to 999 that specifies the milliseconds. */
	getMilliseconds(): number;
}

/** A container for the time parts of a TimeLike as strings. */
export type TTimeStrings = {
	/** 2 digit hours */
	hours: string;

	/** 2 digit minutes */
	minutes: string;

	/** 2 digit seconds */
	seconds: string;

	/** 3 digit milliseconds */
	milli: string;

	/** hh:mm:ss.xxxxxx (full milli) */
	time: string;
};

/**
 * Returns a TTimeStrings type for a new Date()
 */
export function getTimeStrings(): TTimeStrings;

/**
 * Returns a TTimeStrings type for the given TimeLike
 */
export function getTimeStrings<T extends TimeLike>(timeLike: T): TTimeStrings;

export function getTimeStrings(timeLike = new Date()): TTimeStrings {
	const hours = String(timeLike.getHours()).padStart(2, "0");
	const minutes = String(timeLike.getMinutes()).padStart(2, "0");
	const seconds = String(timeLike.getSeconds()).padStart(2, "0");
	const milli = String(timeLike.getMilliseconds()).slice(0, 3).padEnd(3, "0");
	const time = `${hours}:${minutes}:${seconds}.${milli}`;
	return { hours, minutes, seconds, milli, time };
}
