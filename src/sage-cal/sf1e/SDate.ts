import SageDate from "../SageDate";
import {
	Days, DayType, Months, MonthType, TDayType, TMonthType
} from "./cal";

export default class SDate extends SageDate<SDate, DayType, TDayType, MonthType, TMonthType> {

	public get dayType(): DayType { return this._.getDay(); }
	public get day(): TDayType { return Days[this._.getDay()]; }

	public get monthType(): MonthType { return this._.getMonth(); }
	public get month(): TMonthType { return Months[this._.getMonth()]; }

	public static YearDelta = -1700;
}
