import { DateLike, DateStrings, getDateStrings } from "./DateStrings";
import { TimeLike, TimeStrings, getTimeStrings } from "./TimeStrings";

/** A container for the parts of a date/time stamp as strings. */
export type DateTimeStrings = DateStrings & TimeStrings & {
	/** `${date} ${time}` */
	dateTime: string;
};

/**
 * Returns a DateTimeStrings type for a new Date()
 */
export function getDateTimeStrings(): DateTimeStrings;

/**
 * Returns a DateTimeStrings type for the given Date
 */
export function getDateTimeStrings<T extends DateLike & TimeLike>(dateTimeLike: T): DateTimeStrings;

export function getDateTimeStrings(dateTimeLike = new Date()): DateTimeStrings {
	const dateStrings = getDateStrings(dateTimeLike);
	const timeStrings = getTimeStrings(dateTimeLike);
	const dateTime = `${dateStrings.date} ${timeStrings.time}`;
	return { dateTime, ...dateStrings, ...timeStrings };
}
