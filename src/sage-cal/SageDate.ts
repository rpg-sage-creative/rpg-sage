import { getDateStrings } from "../sage-utils/utils/DateUtils";
import { Days, Months } from "../sage-utils/utils/DateUtils/consts";
import type { DayType, MonthType } from "../sage-utils/utils/DateUtils/enums";
import type { IDate, TDayType, TMonthType } from "../sage-utils/utils/DateUtils/types";

const DayMS = 1000 * 60 * 60 * 24;

export default class SageDate<
		S extends SageDate<any, any, any, any, any>,
		T extends number = DayType,
		U extends string = TDayType,
		V extends number = MonthType,
		W extends string = TMonthType
		> implements IDate {
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
	public get day(): U { return Days[this._.getDay()] as U; }

	public get monthType(): V { return this._.getMonth() as V; }
	public get month(): W { return Months[this._.getMonth()] as W; }

	public getPrevDay(): S {
		const constructor = this.constructor as typeof SageDate
		return new constructor(new Date(this._.getTime() - DayMS)) as S;
	}
	public getNextDay(): S {
		const constructor = this.constructor as typeof SageDate
		return new constructor(new Date(this._.getTime() + DayMS)) as S;
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
		const day = this._.toLocaleString(undefined, { weekday:"long" });
		const month = this._.toLocaleString(undefined, { month:"long" });
		return `${day}, ${month} ${this.getDate()}, ${this.getEarthFullYear()}`;
	}

	public getEarthFullYear(): number { return this._.getFullYear(); }

	//#region IDate
	public getFullYear(): number { return this._.getFullYear() + (this.constructor as typeof SageDate).YearDelta; }
	public getMonth(): number { return this._.getMonth(); }
	public getDate(): number { return this._.getDate(); }
	//#endregion

	public static YearDelta = 0;
}
