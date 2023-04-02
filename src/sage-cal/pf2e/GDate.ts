import { TemperateSeason, TropicalSeason, getTemperateSeason, getTropicalSeason } from "../../sage-utils/DateUtils";
import { SageDate } from "../SageDate";
import { Day, Month } from "./cal";

/** This represents a Date on Golarion, the primary world of Pathfinder RPG. */
export class GDate
	extends SageDate<GDate, Day, keyof typeof Day, Month, keyof typeof Month> {

	/** the day of the week as an enum */
	public get day(): Day {
		return this.earthDate.getDay();
	}

	/** the name of day of the week */
	public get dayName(): keyof typeof Day {
		return Day[this.earthDate.getDay()] as keyof typeof Day;
	}

	/** the month as an enum */
	public get month(): Month {
		return this.earthDate.getMonth();
	}

	/** the name of the month */
	public get monthName(): keyof typeof Month {
		return Month[this.earthDate.getMonth()] as keyof typeof Month;
	}

	/** the temperate season */
	public get temperateSeason(): TemperateSeason {
		return GDate.dateToTemperateSeason(this.earthDate);
	}

	/** the name of the temperate season */
	public get temperateSeasonName(): keyof typeof TemperateSeason {
		return TemperateSeason[this.temperateSeason] as keyof typeof TemperateSeason;
	}

	/** the tropical season */
	public get tropicalSeason(): TropicalSeason {
		return GDate.dateToTropicalSeason(this.earthDate);
	}

	/** the name of the tropical season */
	public get tropicalSeasonName(): keyof typeof TropicalSeason {
		return TropicalSeason[this.tropicalSeason] as keyof typeof TropicalSeason;
	}

	/** The difference between this year and the Earth-based year. */
	public static YearDelta = 2700;

	public static dateToTemperateSeason(date: Date): TemperateSeason {
		return getTemperateSeason(date);
	}

	public static dateToTropicalSeason(date: Date): TropicalSeason {
		return getTropicalSeason(date);
	}
}
