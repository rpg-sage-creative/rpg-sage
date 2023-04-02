import { isDate } from "util/types";
import { DateLike, Day, MILLISECONDS_PER_DAY, Month, getDateStrings } from "../sage-utils/DateUtils";

/**
 * This class allows us to link an in game Date to a real world Earth date.
 * Designed originally for use with Pathfinder and Starfinder.
 */
export class SageDate<
		S extends SageDate<any, T, U, V, W>,
		T extends number = Day,
		U extends string = keyof typeof Day,
		V extends number = Month,
		W extends string = keyof typeof Month,
		> implements DateLike {

	/** The underlying Earth-based Date object. */
	public earthDate: Date;

	/** Uses new Date(). */
	public constructor();

	/** Uses the Date given. */
	public constructor(date: Date);

	/** Gets the year from new Date(). */
	public constructor(month: number, date: number);

	/** Expects Earth year. */
	public constructor(year: number, month: number, date: number);

	public constructor(dateOrYearOrMonth?: Date | number, monthOrDate?: number, date?: number) {
		if (!dateOrYearOrMonth) {
			// constructor()
			this.earthDate = new Date();

		} else if (isDate(dateOrYearOrMonth)) {
			// constructor(date: Date)
			this.earthDate = dateOrYearOrMonth;

		} else {
			this.earthDate = new Date();
			if (date) {
				// constructor(year: number, month: number, date: number)
				this.earthDate.setFullYear(dateOrYearOrMonth, monthOrDate, date);
			} else {
				// constructor(month: number, date: number)
				this.earthDate.setMonth(dateOrYearOrMonth, monthOrDate);
			}
		}
	}

	/** Is the underlying Earth-based date today. */
	public get isToday(): boolean {
		const today = new Date();
		return today.getFullYear() === this.earthDate.getFullYear()
			&& today.getMonth() === this.earthDate.getMonth()
			&& today.getDate() === this.earthDate.getDate();
	}

	/** the day of the week as an enum. */
	public get day(): T {
		return this.earthDate.getDay() as T;
	}

	/** the name of day of the week. */
	public get dayName(): U {
		return Day[this.earthDate.getDay()] as U;
	}

	/** the month as an enum. */
	public get month(): V {
		return this.earthDate.getMonth() as V;
	}

	/** the month's name. */
	public get monthName(): W {
		return Month[this.earthDate.getMonth()] as W;
	}

	/** Returns a new SageDate with the day decremented by 1. */
	public getPrevDay(): S {
		const constructor = this.constructor as typeof SageDate
		return new constructor(new Date(this.earthDate.getTime() - MILLISECONDS_PER_DAY)) as S;
	}

	/** Returns a new SageDate with the day incremented by 1. */
	public getNextDay(): S {
		const constructor = this.constructor as typeof SageDate
		return new constructor(new Date(this.earthDate.getTime() + MILLISECONDS_PER_DAY)) as S;
	}

	/** Returns a new Date object for the underlying Earth date. */
	public toDate(): Date {
		return new Date(this.earthDate);
	}

	/** Returns the date as yyyy-mm-dd */
	public toString(): string {
		return getDateStrings(this).date;
	}

	/** Returns a long form date, ex: "Starday, Kuthona 24, 4678" */
	public toLongString(): string {
		return `${this.dayName}, ${this.monthName} ${this.getDate()}, ${this.getFullYear()}`;
	}

	/** Returns the underlying Earth-based date as yyyy-mm-dd */
	public toEarthString(): string {
		return getDateStrings(this.earthDate).date;
	}

	/** Returns a long form date for the underlying Earth-based date, ex: "Saturday, December 24, 1978" */
	public toLongEarthString(): string {
		const day = Day[this.earthDate.getDay()];
		const month = Month[this.earthDate.getMonth()];
		return `${day}, ${month} ${this.getDate()}, ${this.getEarthFullYear()}`;
	}

	/** Gets the Earth-based year. */
	public getEarthFullYear(): number {
		return this.earthDate.getFullYear();
	}

	//#region DateLike

	/** Gets the year. */
	public getFullYear(): number {
		return this.earthDate.getFullYear() + (this.constructor as typeof SageDate).YearDelta;
	}

	/** Gets the month. */
	public getMonth(): number {
		return this.earthDate.getMonth();
	}

	/** Gets the day of the month. */
	public getDate(): number {
		return this.earthDate.getDate();
	}

	//#endregion

	/** The difference between this year and the Earth-based year. */
	public static YearDelta = 0;
}
