import { TemperateSeason, TropicalSeason, getTemperateSeason, getTropicalSeason } from "@rsc-utils/core-utils";
import { SageDate } from "../../../../calendar/SageDate.js";
import { DayType, Days, MonthType, Months, type DayName, type MonthName } from "./internal/types.js";

export class GDate extends SageDate<GDate, DayType, DayName, MonthType, MonthName> {

	public override get dayType(): DayType { return this._.getDay(); }
	public override get day(): DayName { return Days[this._.getDay()]!; }

	public override get monthType(): MonthType { return this._.getMonth(); }
	public override get month(): MonthName { return Months[this._.getMonth()]!; }

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

	public static override readonly YearDelta = 2700;

	public static dateToTemperateSeason(date: Date): TemperateSeason {
		return getTemperateSeason(date);
	}

	public static dateToTropicalSeason(date: Date): TropicalSeason {
		return getTropicalSeason(date);
	}

	public static readonly Days = Days;
	public static readonly Months = Months;
}
