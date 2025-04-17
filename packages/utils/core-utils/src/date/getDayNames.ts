import { Day } from "./Day.js";

export type DayName = keyof typeof Day;

export function getDayNames(): DayName[] {
	return Object.keys(Day)
		.filter(key => typeof(Day[key as DayName]) === "number") as DayName[];
}
