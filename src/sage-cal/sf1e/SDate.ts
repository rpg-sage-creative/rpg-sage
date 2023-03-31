import { SageDate } from "../SageDate";
import { Day, Month } from "./cal";

/** This represents a Date on Absalom, the primary setting of Starfinder RPG. */
export class SDate
	extends SageDate<SDate, Day, keyof typeof Day, Month, keyof typeof Month> {

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

	/** The difference between this year and the Earth-based year. */
	public static YearDelta = -1700;
}
