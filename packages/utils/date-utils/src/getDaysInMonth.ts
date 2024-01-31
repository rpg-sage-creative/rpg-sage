import type { Month } from "./Month.js";
import { getDaysPerMonth } from "./getDaysPerMonth.js";

/** Returns the number of days in the given month. */
export function getDaysInMonth(month: Month): number {
	return getDaysPerMonth()[month];
}