import { Month } from "./Month.js";

export type MonthName = keyof typeof Month;

export function getMonthNames(): MonthName[] {
	return Object.keys(Month)
		.filter(key => typeof(Month[key as MonthName]) === "number") as MonthName[];
}
