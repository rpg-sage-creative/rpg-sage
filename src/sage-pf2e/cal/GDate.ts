
import utils, { TemperateSeasonType, TropicalSeasonType } from "../../sage-utils";
import {
	Days, DayType, Months, MonthType, TDayType, TMonthType
} from "./cal";

function toYearMonthDayString(date: IDate): string {
	const year = date.getFullYear(),
		month = String(date.getMonth() + 1).padStart(2, "0"),
		day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

interface IDate {
	getFullYear(): number;
	getMonth(): number;
	getDate(): number;
}

const DayMS = 1000 * 60 * 60 * 24;

export default class GDate implements IDate {
	public _: Date;

	public constructor();
	public constructor(date: Date);
	public constructor(month: number, date: number);
	/** Expects an Earth year */
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

	public get dayType(): DayType { return this._.getDay(); }
	public get day(): TDayType { return Days[this._.getDay()]; }

	public get monthType(): MonthType { return this._.getMonth(); }
	public get month(): TMonthType { return Months[this._.getMonth()]; }

	public get temperateSeasonType(): TemperateSeasonType {
		return GDate.dateToTemperateSeason(this._);
	}
	public get temperateSeason(): keyof typeof TemperateSeasonType {
		return TemperateSeasonType[this.temperateSeasonType] as keyof typeof TemperateSeasonType;
	}

	public get tropicalSeasonType(): TropicalSeasonType {
		return GDate.dateToTropicalSeason(this._);
	}
	public get tropicalSeason(): keyof typeof TropicalSeasonType {
		return TropicalSeasonType[this.tropicalSeasonType] as keyof typeof TropicalSeasonType;
	}

	public getPrevDay(): GDate {
		return new GDate(new Date(this._.getTime() - DayMS));
	}
	public getNextDay(): GDate {
		return new GDate(new Date(this._.getTime() + DayMS));
	}

	public toDate(): Date { return new Date(this._.getDate()); }

	public toString(): string {
		return toYearMonthDayString(this);
	}
	public toLongString(): string {
		return `${this.day}, ${this.month} ${this.getDate()}, ${this.getFullYear()}`;
	}
	public toEarthString(): string {
		return toYearMonthDayString(this._);
	}
	public toLongEarthString(): string {
		const day = this._.toLocaleString(undefined, { weekday:"long" });
		const month = this._.toLocaleString(undefined, { month:"long" });
		return `${day}, ${month} ${this.getDate()}, ${this.getEarthFullYear()}`;
	}

	public getEarthFullYear(): number { return this._.getFullYear(); }

	//#region IDate
	public getFullYear(): number { return this._.getFullYear() + GDate.YearDelta; }
	public getMonth(): number { return this._.getMonth(); }
	public getDate(): number { return this._.getDate(); }
	//#endregion

	public static YearDelta = 2700;

	public static dateToTemperateSeason(date: Date): TemperateSeasonType {
		return utils.DateUtils.getTemperateSeason(date);
	}

	public static dateToTropicalSeason(date: Date): TropicalSeasonType {
		return utils.DateUtils.getTropicalSeason(date);
	}
}
