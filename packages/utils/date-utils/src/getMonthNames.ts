import { getEnumValues } from "@rsc-utils/enum-utils";
import { Month } from "./Month.js";

export type MonthName = keyof typeof Month;

export function getMonthNames(): MonthName[] {
	return getEnumValues(Month);
}
