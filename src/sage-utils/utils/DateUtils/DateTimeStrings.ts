import { DateLike, TDateStrings, getDateStrings } from "./DateStrings";
import { TTimeStrings, TimeLike, getTimeStrings } from "./TimeStrings";

/** A container for the parts of a date/time stamp as strings. */
export type TDateTimeStrings = TDateStrings & TTimeStrings & {
	/** `${date} ${time}` */
	dateTime: string;
};

/**
 * Returns a TDateTimeStrings type for a new Date()
 */
export function getDateTimeStrings(): TDateTimeStrings;

/**
 * Returns a TDateTimeStrings type for the given Date
 */
export function getDateTimeStrings<T extends DateLike & TimeLike>(dateTimeLike: T): TDateTimeStrings;

export function getDateTimeStrings(dateTimeLike = new Date()): TDateTimeStrings {
	const dateStrings = getDateStrings(dateTimeLike);
	const timeStrings = getTimeStrings(dateTimeLike);
	const dateTime = `${dateStrings.date} ${timeStrings.time}`;
	return { dateTime, ...dateStrings, ...timeStrings };
}
