import { SageDate } from "../../../../calendar/SageDate.js";
import { Days, DayType, Months, MonthType, type DayName, type MonthName } from "./internal/types.js";

export class SDate extends SageDate<SDate, DayType, DayName, MonthType, MonthName> {

	public override get dayType(): DayType { return this._.getDay(); }
	public override get day(): DayName { return Days[this._.getDay()]!; }

	public override get monthType(): MonthType { return this._.getMonth(); }
	public override get month(): MonthName { return Months[this._.getMonth()]!; }

	public static override readonly YearDelta = -1700;

	public static readonly Days = Days;
	public static readonly Months = Months;
}
