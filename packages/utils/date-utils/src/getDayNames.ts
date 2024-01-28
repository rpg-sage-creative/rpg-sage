import { getEnumValues } from "@rsc-utils/enum-utils";
import { Day } from "./Day.js";

export type DayName = keyof typeof Day;

export function getDayNames(): DayName[] {
	return getEnumValues(Day);
}
