import type { DayType, HemisphereType, MonthType, SeasonType } from "./enums";

export type TMonthType = keyof typeof MonthType;

export type TDayType = keyof typeof DayType;

export type TSeasonType = keyof typeof SeasonType;

export type THemisphereType = keyof typeof HemisphereType;

// type TDigit = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9";
// type T2Digit = `${TDigit}${TDigit}`;
// type T3Digit = `${TDigit}${TDigit}${TDigit}`;
// type T4Digit = `${TDigit}${TDigit}${TDigit}${TDigit}`;

export interface IDate {
	getFullYear(): number;
	getMonth(): number;
	getDate(): number;
}

export type TDateStrings = {
	year: string;
	month: string;
	day: string;
	hours: string;
	minutes: string;
	seconds: string;
	milli: string;
	date: string;
	time: string;
	dateTime: string;
};
