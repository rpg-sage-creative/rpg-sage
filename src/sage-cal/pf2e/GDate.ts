import { TemperateSeason, TropicalSeason, getTemperateSeason, getTropicalSeason } from "@rsc-utils/date-utils";
import { SageDate } from "../SageDate";
import {
	DayType,
	Days,
	MonthType,
	Months,
	TDayType, TMonthType
} from "./cal";

export class GDate extends SageDate<GDate, DayType, TDayType, MonthType, TMonthType> {

	public get dayType(): DayType { return this._.getDay(); }
	public get day(): TDayType { return Days[this._.getDay()]; }

	public get monthType(): MonthType { return this._.getMonth(); }
	public get month(): TMonthType { return Months[this._.getMonth()]; }

	public get temperateSeasonType(): TemperateSeason {
		return GDate.dateToTemperateSeason(this._);
	}
	public get temperateSeason(): keyof typeof TemperateSeason {
		return TemperateSeason[this.temperateSeasonType] as keyof typeof TemperateSeason;
	}

	public get tropicalSeasonType(): TropicalSeason {
		return GDate.dateToTropicalSeason(this._);
	}
	public get tropicalSeason(): keyof typeof TropicalSeason {
		return TropicalSeason[this.tropicalSeasonType] as keyof typeof TropicalSeason;
	}

	public static YearDelta = 2700;

	public static dateToTemperateSeason(date: Date): TemperateSeason {
		return getTemperateSeason(date);
	}

	public static dateToTropicalSeason(date: Date): TropicalSeason {
		return getTropicalSeason(date);
	}
}
