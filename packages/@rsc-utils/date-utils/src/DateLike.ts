
export interface DateLike {
	getFullYear(): number;

	/** The month as a number between 0 and 11 (January to December). */
	getMonth(): number;

	/** The date as a number between 1 and 31. */
	getDate(): number;

	/** A number from 0 to 23 (midnight to 11pm) that specifies the hour. */
	getHours(): number;

	/** A number from 0 to 59 that specifies the minutes. */
	getMinutes(): number;

	/** A number from 0 to 59 that specifies the seconds. */
	getSeconds(): number;

	/** A number from 0 to 999 that specifies the milliseconds. */
	getMilliseconds(): number;

	getTime(): number;
}
