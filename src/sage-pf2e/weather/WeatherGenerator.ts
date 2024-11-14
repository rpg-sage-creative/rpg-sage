import { isDefined, parse, stringify } from "@rsc-utils/core-utils";
import { Season } from "@rsc-utils/date-utils";
import { randomBoolean, randomInt, rollDiceString, rollDie, type SimpleDice } from "@rsc-utils/dice-utils";
import { fahrenheitToCelsius } from "@rsc-utils/temperature-utils";
import { GDate } from "../../sage-cal/pf2e/GDate.js";
import { WindStrength, rollOnTable, rollTemperatureVariation, type CloudCoverTableItem, type PrecipitationTableItem, type WindTableItem } from "../index.js";
import {
	ClimateType,
	CloudCoverType,
	ElevationType,
	PrecipitationFrequencyType,
	PrecipitationIntensityType,
	WindType,
	getBasePrecipitationFrequency,
	getBasePrecipitationIntensity,
	getBaseTemp,
	testForPrecipitation
} from "./weather.js";

const HeavySnow = "Heavy Snow";

//TODO: integrate the time data from https://sunrise-sunset.org/api

function roll(diceString: SimpleDice | "0" | "1"): number {
	if (diceString === "0" || diceString === "1") {
		return +diceString;
	}
	return rollDiceString(diceString) ?? 0;
}
function rollDelta(): number {
	const multiplier = randomBoolean() ? 1 : -1;
	return roll("1d3-1") * multiplier;
}

export interface IWeatherDayResult {
	genProps: IGenParameters,
	date: GDate;
	high: number;
	current: number;
	low: number;
	cloudCover: CloudCoverType;
	precipIntensity?: PrecipitationIntensityType;
	precipStart?: number;
	precipDuration?: number;
	precipItem?: PrecipitationTableItem;
	windStrength?: WindType;
	hours: IWeatherHourResult[];
	description?: string;
}

export interface IWeatherHourResult {
	hour: number;
	// dayNight: cal.DayNightType;
	temp: number;
	cloudCover: CloudCoverType;
	precipitation?: string;
	windStrength?: WindType;
	windSpeed?: number;
	description?: string;
}

interface IGenParameters {
	climate: ClimateType;
	elevation: ElevationType;
	desert: boolean;
}

export class WeatherGenerator {
	public desert = false;
	public constructor(public climate: ClimateType, public elevation: ElevationType, public date = new GDate()) { }

	public createToday(): IWeatherDayResult {
		return generateDays(this, this.date, 1).shift()!;
	}
	public createNextWeek(): IWeatherDayResult[] {
		return generateDays(this, this.date, 7);
	}
	public createNextMonth(): IWeatherDayResult[] {
		return generateDays(this, this.date, 31);
	}
	public createNextYear(): IWeatherDayResult[] {
		return generateDays(this, this.date, 366);
	}

	public createMonth(monthType = this.date.monthType): IWeatherDayResult[] {
		const gdate = new GDate(new Date(this.date.getEarthFullYear(), monthType, 1)),
			days = generateDays(this, gdate, 31);
		monthType = gdate.monthType;
		while (days[days.length - 1].date.monthType !== monthType) {
			days.pop();
		}
		return days;
	}
	public createYear(year = this.date.getFullYear()): IWeatherDayResult[] {
		const gdate = new GDate(new Date(year - GDate.YearDelta, 0, 1)),
			days = generateDays(this, gdate, 366);
		year = gdate.getFullYear();
		while (days[days.length - 1].date.getFullYear() !== year) {
			days.pop();
		}
		return days;
	}

	/**
	 * Creates export data for the given days.
	 * Defaults to TSV.
	 */
	public static createExport(dayOrDays: IWeatherDayResult | IWeatherDayResult[], delimiter: ExportDelimiter = "\t"): string {
		return createExport(Array.isArray(dayOrDays) ? dayOrDays : [dayOrDays], delimiter);
	}
}
export type ExportDelimiter = "," | "\t" | "|";

function createExport(days: IWeatherDayResult[], delimiter: ExportDelimiter): string {
	const output: string[] = [];
	const join = delimiter === ","
		? (cols: string[]) => cols.map(s => String(s).includes(",") ? `"${s}"` : s).join(",")
		: (cols: string[]) => cols.join(delimiter);
	output.push(join([
		"Elevation",
		"Climate",
		"Desert",
		"Month",
		"Date",
		"Day",
		"Year",
		"High",
		"Low",
		"Cloud Cover",
		"Precip Intensity",
		"Precip Start Hour",
		"Precip Duration Hour",
		"Wind Type",
		"Description",
		"Hour",
		"Temp F",
		"Temp C",
		"Cloud Cover",
		"Precip",
		"Wind Type",
		"Wind Speed",
		"Description"
	]));
	days.forEach(day => {
		const dayColumns = <any[]>[
			ElevationType[day.genProps.elevation],
			ClimateType[day.genProps.climate],
			day.genProps.desert,
			day.date.month,
			day.date.getDate(),
			day.date.day,
			day.date.getFullYear(),
			day.high,
			day.low,
			CloudCoverType[day.cloudCover],
			PrecipitationIntensityType[day.precipIntensity!],
			day.precipStart,
			day.precipDuration,
			WindType[day.windStrength!],
			day.description
		];
		day.hours.forEach(hour => {
			const hourColumns = [
				hour.hour,
				hour.temp,
				fahrenheitToCelsius(hour.temp),
				CloudCoverType[hour.cloudCover],
				hour.precipitation,
				WindType[hour.windStrength!],
				hour.windSpeed,
				hour.description
			];
			output.push(join(dayColumns.concat(hourColumns)));
		});
	});
	return output.join("\n");
}

function createTemps(high: number, low: number): number[] {
	const delta = (high - low) / 12,
		temps: number[] = [];
	for (let i = 0; i < 12; i++) {
		temps[i] = low + delta * i;
		temps[i + 12] = high - delta * i;
	}
	for (let i = 0; i < 3; i++) {
		temps.unshift(temps.pop()!);
	}
	return temps.map(temp => Math.round(temp));
}

/*
// function getDayNight(day: Date, hour: number): cal.DayNightType {
// 	return 5 < hour && hour < 18 ? cal.DayNightType.Day : cal.DayNightType.Night;
// }
*/

function generateDays(generator: IGenParameters, date: GDate, dayCount: number): IWeatherDayResult[] {
	/*
	// each random weather roll generates multiple days; do that until you have dayCount
	let //climate = generator.climate,
		//elevation = generator.elevation,
		//desert = generator.desert,
		*/
	const days: IWeatherDayResult[] = [];
	let weather: IWeatherDayResult[];
	while (days.length < dayCount) {
		weather = randomWeather(generator, date);
		date = weather[weather.length - 1].date.getNextDay();
		while (weather.length) {
			days.push(weather.shift()!);
		}
	}
	generateHours(days);
	normalizeDailyResults(days);
	return days.slice(0, dayCount);
}
function generateHours(days: IWeatherDayResult[]): void {
	days.forEach(day => {
		day.hours = createTemps(day.high, day.low).map((temp, hour) => createHourResult(day, hour, temp));
	});
}
function normalizeDailyResults(days: IWeatherDayResult[]): void {
	// if you have 2 days of same temp, followed by 2 days of another same, stagger the change
	days.forEach((today, todayIndex) => {
		const yesterday = days[todayIndex - 1],
			tomorrow = days[todayIndex + 1],
			dayAfter = days[todayIndex + 2];
		if (!yesterday || !tomorrow || !dayAfter) {
			return;
		}
		if (yesterday.high === today.high && tomorrow.high === dayAfter.high) {
			const delta = Math.round((tomorrow.high - today.high) / 3);
			today.high += delta;
			today.low += delta;
			tomorrow.high -= delta;
			tomorrow.low -= delta;
		}
	});
	// find a day that is the same high as the days adjacent to it
	days.filter((today, todayIndex) => {
		const yesterday = days[todayIndex - 1],
			tomorrow = days[todayIndex + 1];
		return (yesterday && yesterday.high === today.high) || (tomorrow && today.high === tomorrow.high);
	}).forEach(day => {
		// adjust the temps by a small delta to break up long chains of the same temp
		day.high += rollDelta();
		day.low += rollDelta();
	});
	createHourlyResults(days);
	days.forEach(day => {
		const precipHour = day.hours.find(hour => hour.precipitation),
			precip = precipHour?.precipitation ?? "",
			cloudCover = precipHour?.cloudCover ?? day.cloudCover,
			cloudText = cloudCoverToString(cloudCover),
			windStrength = precipHour && WindType[precipHour.windStrength ?? day.windStrength!],
			windText = ((windStrength ?? "No") + " Wind").replace("Windstorm Wind", "Windstorm");
		day.description = `${precip || cloudText}, ${windText}`;
	});
}
function cloudCoverToString(cloudCover: CloudCoverType): string {
	switch (cloudCover) {
		case CloudCoverType.Light: return "Partly Cloudy";
		case CloudCoverType.Medium: return "Cloudy";
	}
	return cloudCover ? "Overcast" : "Clear";
}
function mapHours({ oldResult, hour, precip, day, windItem }: { oldResult: IWeatherHourResult; hour: number; precip?:PrecipitationTableItem; day:IWeatherDayResult; windItem:WindTableItem; }): IWeatherHourResult {
	const hourPrecip = precip && day.precipStart! <= hour && hour < day.precipStart! + day.precipDuration! ? precip.precipitation : undefined,
		hourResult = createHourResult(day, hour, oldResult.temp, hourPrecip, windItem);
	if (!hourResult.precipitation) {
		hourResult.precipitation = oldResult.precipitation;
		hourResult.windSpeed = oldResult.windSpeed;
		hourResult.windStrength = oldResult.windStrength;
	}
	return hourResult;
}
function createHourlyResults(days: IWeatherDayResult[]): void {
	/*// const nowHour = (new Date()).getHours();*/
	days.forEach((day, dayIndex) => {
		let hasPrecip = false;
		let precip: PrecipitationTableItem | undefined;
		let precipEnd: number | null = null;
		let windItem: WindTableItem;
		if (isDefined(day.precipIntensity) && isDefined(day.precipStart)) {
			hasPrecip = true;

			precip = getPrecipitation(day.precipIntensity, day.hours[day.precipStart].temp);
			day.precipItem = precip;
			day.precipDuration = roll(precip.duration);
			precipEnd = day.precipStart + day.precipDuration;

			windItem = getWind(precip);
			day.windStrength = WindType[windItem.strength];

			if (precip.precipitation === HeavySnow && day.windStrength >= WindType.Severe) {
				// If Heavy Snow and Severe Wind, there is a 20% (1 in 5) chance of a Blizzard
				precip = <PrecipitationTableItem>{ precipitation: "Blizzard", duration: "2d12", min: 1, max: 1 };
				if (rollDie(5) === 5) {
					day.precipDuration = roll("2d12");
				}
			}
		}else {
			windItem = getWind();
			day.windStrength = WindType[windItem.strength];
		}

		day.hours = day.hours.map((oldResult, hour) => mapHours({ oldResult, hour, precip, day, windItem }));
		doTomorrow(days, dayIndex, hasPrecip, windItem, precipEnd, precip);
		doYesterday(days, dayIndex, hasPrecip);
	});
	normalizeHourlyResults(days);
}

/** If precipitation carries over from a previous day, we need to go back and get .precipIntensity */
function doYesterday(days: IWeatherDayResult[], todayIndex: number, todayHasPrecip: boolean): void {
	const today = days[todayIndex];
	if (!todayHasPrecip && today.hours[0].precipitation) {
		const yesterday = days[todayIndex - 1];
		if (yesterday) {
			today.precipIntensity = yesterday.precipIntensity;
		}
	}
}

/** If precipitation carroes over to the next day, we need to preconfigure the weather event in .hours */
function doTomorrow(days: IWeatherDayResult[], todayIndex: number, todayHasPrecip: boolean, windItem: WindTableItem, precipEnd: number | null, precip?: PrecipitationTableItem): void {
	if (todayHasPrecip && precipEnd! > 23) {
		const tomorrow = days[todayIndex + 1];
		if (tomorrow) {
			for (let i = 0; i < precipEnd! - 24; i++) {
				tomorrow.hours[i] = createHourResult(tomorrow, i, tomorrow.hours[i].temp, precip!.precipitation, windItem);
			}
		}
	}
}
function createHourResult(day: IWeatherDayResult, hour: number, temp: number, precipitation?: string, wind?: WindTableItem): IWeatherHourResult {
	if (precipitation?.includes("Sleet")) {
		precipitation = precipitation.split("|")[temp < 40 ? 1 : 0];
	}
	if (!precipitation && day.hours[hour]) {
		precipitation = day.hours[hour].precipitation;
	}
	return {
		hour: hour,
		// dayNight: getDayNight(day.date.toDate(), hour),
		temp: temp,
		cloudCover: day.cloudCover,
		precipitation: precipitation,
		windStrength: WindType[<keyof typeof WindType>wind?.strength],
		windSpeed: wind ? roll(wind.speed) : undefined,
		// description: undefined,
	};
}
function normalizeHourlyResults(days: IWeatherDayResult[]): void {
	// adjacent days that don't match cause a mismatch, so generate new deltas between two days
	const nowHour = (new Date()).getHours();
	days.forEach((today, todayIndex) => {
		if (!todayIndex) {
			return;
		}
		const yesterday = days[todayIndex - 1],
			temps = createTemps(yesterday.high, today.low);
		let hourIndex = 0;
		for (hourIndex = 14; hourIndex < 24; hourIndex++) {
			yesterday.hours[hourIndex].temp = temps[hourIndex];
		}
		for (hourIndex = 0; hourIndex < 3; hourIndex++) {
			today.hours[hourIndex].temp = temps[hourIndex];
		}
		yesterday.current = Math.round(yesterday.hours[nowHour].temp);
		today.current = Math.round(today.hours[nowHour].temp);
	});
}

function getPrecipitation(intensity: PrecipitationIntensityType, temp: number): PrecipitationTableItem {
	const key = `${PrecipitationIntensityType[intensity]}${temp < 32 ? "F" : "Unf"}rozenPrecipitation`;
	return rollOnTable(key);
}
function getWind(precip?: PrecipitationTableItem): WindTableItem {
	if (precip) {
		const lower = precip.precipitation.toLowerCase();
		if (lower.includes("fog")) {
			return parse(stringify(WindStrength[0]));
		}
		if (lower.includes("thunderstorm")) {
			return rollOnTable("ThunderstormWinds");
		}
	}
	return rollOnTable("WindStrength");
}
function getOvercastVariation(isOvercast: boolean, hasPrecip: boolean, season: Season): -10 | 0 | 10 {
	if (isOvercast && !hasPrecip) {
		return season === Season.Fall || season === Season.Winter ? 10 : -10;
	}
	return 0;
}
function randomWeather(properties: IGenParameters, date: GDate): IWeatherDayResult[] {
	const season = date.temperateSeasonType as number as Season,
		tempVariationItem = rollTemperatureVariation(properties.climate),
		tempVariation = roll(tempVariationItem.variation),
		days: IWeatherDayResult[] = [];

	let tempDuration = roll(tempVariationItem.duration);
	while (tempDuration--) {
		const precipFrequency = properties.desert ? PrecipitationFrequencyType.Drought : getBasePrecipitationFrequency(properties.climate, season, properties.elevation),
			hasPrecip = testForPrecipitation(precipFrequency),
			precipIntensity = hasPrecip ? getBasePrecipitationIntensity(properties.climate, season, properties.elevation) : undefined,

			cloudCoverItem = hasPrecip ? null : rollOnTable<CloudCoverTableItem>("CloudCover"),
			cloudCover = hasPrecip ? CloudCoverType.Overcast : CloudCoverType[<keyof typeof CloudCoverType>cloudCoverItem!.cloudCover],
			isOvercast = cloudCover === CloudCoverType.Overcast,

			overcastVariation = getOvercastVariation(isOvercast, hasPrecip, season),

			baseTemp = getBaseTemp(properties.climate, season, properties.elevation),
			high = baseTemp + tempVariation + overcastVariation,
			lowDelta = roll("2d6+3"),
			low = high - lowDelta;
		days.push({
			genProps: properties,
			date: date,
			high: high,
			current: 0,
			low: low,
			cloudCover: cloudCover,
			precipIntensity: precipIntensity,
			precipStart: hasPrecip ? randomInt(0, 23) : undefined,
			// precipDuration: undefined,
			// precipItem: undefined,
			// windStrength: undefined,
			hours: [],
			// description: undefined
		});
		date = date.getNextDay();
	}

	return days;
}
