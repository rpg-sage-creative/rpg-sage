import { DayType, MonthType } from "./enums";
import type { TDayType, TMonthType } from "./types";

export const MonthTypes = [MonthType.January, MonthType.February, MonthType.March, MonthType.April, MonthType.May, MonthType.June, MonthType.July, MonthType.August, MonthType.September, MonthType.October, MonthType.November, MonthType.December];
export const Months: TMonthType[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const DayTypes = [DayType.Monday, DayType.Tuesday, DayType.Wednesday, DayType.Thursday, DayType.Friday, DayType.Saturday, DayType.Sunday];
export const Days: TDayType[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DaysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
