import { type DateLike, Day, type DayName, Month, type MonthName, getDateStrings, getDayNames, getMonthNames } from "@rsc-utils/date-utils";

const DayMS = 1000 * 60 * 60 * 24;

export class SageDate<
		S extends SageDate<any, any, any, any, any>,
		T extends number = Day,
		U extends string = DayName,
		V extends number = Month,
		W extends string = MonthName
		> implements DateLike {
	public _: Date;

	public constructor();
	public constructor(date: Date);
	public constructor(month: number, date: number);
	/** Expects Earth year. */
	public constructor(year: number, month: number, date: number);
	public constructor(dateOrYearOrMonth?: Date | number, monthOrDate?: number, date?: number) {
		if (!dateOrYearOrMonth) {
			this._ = new Date();
		} else if (dateOrYearOrMonth instanceof Date) {
			this._ = dateOrYearOrMonth;
		} else {
			this._ = new Date();
			const year = dateOrYearOrMonth;
			if (date) {
				this._.setFullYear(year, monthOrDate, date);
			} else {
				this._.setMonth(year, monthOrDate);
			}
		}
	}

	public get isToday(): boolean {
		const today = new Date();
		return today.getFullYear() === this._.getFullYear()
			&& today.getMonth() === this._.getMonth()
			&& today.getDate() === this._.getDate();
	}

	public get dayType(): T { return this._.getDay() as T; }
	public get day(): U { return getDayNames()[this._.getDay()] as U; }

	public get monthType(): V { return this._.getMonth() as V; }
	public get month(): W { return getMonthNames()[this._.getMonth()] as W; }

	public getPrevDay(): S {
		const cnstr = this.constructor as typeof SageDate;
		return new cnstr(new Date(this._.getTime() - DayMS)) as S;
	}
	public getNextDay(): S {
		const cnstr = this.constructor as typeof SageDate;
		return new cnstr(new Date(this._.getTime() + DayMS)) as S;
	}

	public toDate(): Date { return new Date(this._.getDate()); }

	public toString(): string {
		return getDateStrings(this).date;
	}
	public toLongString(): string {
		return `${this.day}, ${this.month} ${this.getDate()}, ${this.getFullYear()}`;
	}
	public toEarthString(): string {
		return getDateStrings(this._).date;
	}
	public toLongEarthString(): string {
		const day = getDayNames()[this._.getDay()];
		const month = getMonthNames()[this._.getMonth()];
		return `${day}, ${month} ${this.getDate()}, ${this.getEarthFullYear()}`;
	}

	public getEarthFullYear(): number { return this._.getFullYear(); }

	//#region DateLike
	public getFullYear(): number { return this._.getFullYear() + (this.constructor as typeof SageDate).YearDelta; }
	public getMonth(): number { return this._.getMonth(); }
	public getDate(): number { return this._.getDate(); }
	public getHours(): number { return this._.getHours(); }
	public getMinutes(): number { return this._.getMinutes(); }
	public getSeconds(): number { return this._.getSeconds(); }
	public getMilliseconds(): number { return this._.getMilliseconds(); }
	public getTime(): number { return this._.getTime(); }
	//#endregion

	public static YearDelta = 0;
}
