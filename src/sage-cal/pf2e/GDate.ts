import { TemperateSeasonType, TropicalSeasonType } from "../../sage-utils";
import { getTemperateSeason, getTropicalSeason } from "../../sage-utils/utils/DateUtils";
import SageDate from "../SageDate";
import {
	Days, DayType, Months, MonthType, TDayType, TMonthType
} from "./cal";

export default class GDate extends SageDate<GDate, DayType, TDayType, MonthType, TMonthType> {

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

	public static YearDelta = 2700;

	public static dateToTemperateSeason(date: Date): TemperateSeasonType {
		return getTemperateSeason(date);
	}

	public static dateToTropicalSeason(date: Date): TropicalSeasonType {
		return getTropicalSeason(date);
	}
}
