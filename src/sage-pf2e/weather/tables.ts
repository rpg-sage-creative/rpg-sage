import { warn } from "@rsc-utils/console-utils";
import type { SimpleDice } from "@rsc-utils/dice-utils";
import { randomInt } from "@rsc-utils/random-utils";
import { ClimateType, WindType } from "./weather";

export interface TableItem { min: number; max: number; }

type WeatherTables = {
	ColdRegionTemperatureVariations: TableItem[];
	TemperateRegionTemperatureVariations: TableItem[];
	TropicalRegionTemperatureVariations: TableItem[];

	LightUnfrozenPrecipitation: TableItem[];
	LightFrozenPrecipitation: TableItem[];
	MediumUnfrozenPrecipitation: TableItem[];
	MediumFrozenPrecipitation: TableItem[];
	HeavyUnfrozenPrecipitation: TableItem[];
	HeavyFrozenPrecipitation: TableItem[];
	TorrentialUnfrozenPrecipitation: TableItem[];
	TorrentialFrozenPrecipitation: TableItem[];

	ThunderstormWinds: TableItem[];
	WindStrength: TableItem[];

	CloudCover: TableItem[];
};

type WeatherTableKey = keyof WeatherTables;

/** These tables are based on a 1 to 100 (%) model, but they might not always be. */
function getMinMax<T extends TableItem>(tableItems: T[]): [number, number] {
	let min = Infinity;
	let max = -Infinity;
	tableItems.forEach(item => {
		min = Math.min(item.min ?? Infinity, min);
		max = Math.max(item.max ?? -Infinity, max);
	});
	return [min, max];
}

export function rollOnTable<T extends TableItem = TableItem>(tableName: string): T;
export function rollOnTable(tableName: string): TableItem;
export function rollOnTable(tableName: string): TableItem | null {
	const table: TableItem[] | undefined = tables[tableName as WeatherTableKey];
	if (!table) {
		warn(`Invalid Table: ${tableName}`);
		return null;
	}
	if (!table.length) {
		warn(`Empty Table: ${tableName}`);
		return null;
	}

	const [min, max] = getMinMax(table);
	if (min === Infinity || max === -Infinity) {
		warn(`Invalid Table min/max values: ${tableName} min(${min}) / max(${max})`);
		return null;
	}

	const rand = randomInt(min, max);
	const item = table.find(_item => _item.min <= rand && rand <= _item.max) ?? null;
	// We clone the item so that we can manipulate the values when tinkering with weather
	return JSON.parse(JSON.stringify(item));
}

export function rollTemperatureVariation(climate: ClimateType): TemperatureVariationTableItem {
	return rollOnTable(ClimateType[climate] + "RegionTemperatureVariations");
}

export interface TemperatureVariationTableItem extends TableItem {
	variation: SimpleDice | "0";
	duration: SimpleDice;
}

export const ColdRegionTemperatureVariations: TemperatureVariationTableItem[] = [
	{ min: 1, max: 20, variation: "-3d10", duration: "1d4" },
	{ min: 21, max: 40, variation: "-2d10", duration: "1d6+1" },
	{ min: 41, max: 60, variation: "-1d10", duration: "1d6+2" },
	{ min: 61, max: 80, variation: "0", duration: "1d6+2" },
	{ min: 81, max: 95, variation: "+1d10", duration: "1d6+1" },
	{ min: 96, max: 99, variation: "+2d10", duration: "1d4" },
	{ min: 100, max: 100, variation: "+3d10", duration: "1d2" }
];
export const TemperateRegionTemperatureVariations: TemperatureVariationTableItem[] = [
	{ min: 1, max: 5, variation: "-3d10", duration: "1d2" },
	{ min: 6, max: 15, variation: "-2d10", duration: "1d4" },
	{ min: 16, max: 35, variation: "-1d10", duration: "1d4+1" },
	{ min: 36, max: 65, variation: "0", duration: "1d6+1" },
	{ min: 66, max: 85, variation: "+1d10", duration: "1d4+1" },
	{ min: 86, max: 95, variation: "+2d10", duration: "1d4" },
	{ min: 96, max: 100, variation: "+3d10", duration: "1d2" }
];
export const TropicalRegionTemperatureVariations: TemperatureVariationTableItem[] = [
	{ min: 1, max: 10, variation: "-2d10", duration: "1d2" },
	{ min: 11, max: 25, variation: "-1d10", duration: "1d2" },
	{ min: 26, max: 55, variation: "0", duration: "1d4" },
	{ min: 56, max: 85, variation: "+1d10", duration: "1d4" },
	{ min: 86, max: 100, variation: "+2d10", duration: "1d2" }
];

export interface PrecipitationTableItem extends TableItem {
	precipitation: string;
	duration: SimpleDice | "1";
}

const LightFog = "Light Fog";
const MediumFog = "Medium Fog";
const HeavyFog = "Heavy Fog";
const Drizzle = "Drizzle";
const LightRain = "Light Rain";
const MediumRain = "Medium Rain";
const HeavyRain = "Heavy Rain";
const Thunderstorm = "Thunderstorm";
const LightSnow = "Light Snow";
const MediumSnow = "Medium Snow";
const HeavySnow = "Heavy Snow";
const Sleet = "Sleet";

export const LightUnfrozenPrecipitation: PrecipitationTableItem[] = [
	{ min: 1, max: 20, precipitation: LightFog, duration: "1d8" },
	{ min: 21, max: 40, precipitation: MediumFog, duration: "1d6" },
	{ min: 41, max: 50, precipitation: Drizzle, duration: "1d4" },
	{ min: 51, max: 75, precipitation: Drizzle, duration: "2d12" },
	{ min: 76, max: 90, precipitation: LightRain, duration: "1d4" },
	{ min: 91, max: 100, precipitation: `${LightRain}|${Sleet}`, duration: "1" }
];

export const LightFrozenPrecipitation: PrecipitationTableItem[] = [
	{ min: 1, max: 20, precipitation: LightFog, duration: "1d6" },
	{ min: 21, max: 40, precipitation: LightFog, duration: "1d8" },
	{ min: 41, max: 50, precipitation: MediumFog, duration: "1d4" },
	{ min: 51, max: 60, precipitation: LightSnow, duration: "1" },
	{ min: 61, max: 75, precipitation: LightSnow, duration: "1d4" },
	{ min: 76, max: 100, precipitation: LightSnow, duration: "2d12" }
];

export const MediumUnfrozenPrecipitation: PrecipitationTableItem[] = [
	{ min: 1, max: 10, precipitation: MediumFog, duration: "1d8" },
	{ min: 11, max: 20, precipitation: MediumFog, duration: "1d12" },
	{ min: 21, max: 30, precipitation: HeavyFog, duration: "1d4" },
	{ min: 31, max: 35, precipitation: MediumRain, duration: "1d4" },
	{ min: 36, max: 70, precipitation: MediumRain, duration: "1d8" },
	{ min: 71, max: 90, precipitation: MediumRain, duration: "2d12" },
	{ min: 91, max: 100, precipitation: `${MediumRain}|${Sleet}`, duration: "1d4" }
];
export const MediumFrozenPrecipitation: PrecipitationTableItem[] = [
	{ min: 1, max: 10, precipitation: MediumFog, duration: "1d6" },
	{ min: 11, max: 20, precipitation: MediumFog, duration: "1d8" },
	{ min: 21, max: 30, precipitation: HeavyFog, duration: "1d4" },
	{ min: 31, max: 50, precipitation: MediumSnow, duration: "1d4" },
	{ min: 51, max: 90, precipitation: MediumSnow, duration: "1d8" },
	{ min: 91, max: 100, precipitation: MediumSnow, duration: "2d12" }
];
export const HeavyUnfrozenPrecipitation: PrecipitationTableItem[] = [
	{ min: 1, max: 10, precipitation: HeavyFog, duration: "1d8" },
	{ min: 11, max: 20, precipitation: HeavyFog, duration: "2d6" },
	{ min: 21, max: 50, precipitation: HeavyRain, duration: "1d12" },
	{ min: 51, max: 70, precipitation: HeavyRain, duration: "2d12" },
	{ min: 71, max: 85, precipitation: `${HeavyRain}|${Sleet}`, duration: "1d8" },
	{ min: 86, max: 90, precipitation: Thunderstorm, duration: "1" },
	{ min: 91, max: 100, precipitation: Thunderstorm, duration: "1d3" }
];
export const HeavyFrozenPrecipitation: PrecipitationTableItem[] = [
	{ min: 1, max: 10, precipitation: MediumFog, duration: "1d8" },
	{ min: 11, max: 20, precipitation: HeavyFog, duration: "2d6" },
	{ min: 21, max: 60, precipitation: LightSnow, duration: "2d12" },
	{ min: 61, max: 90, precipitation: MediumSnow, duration: "1d8" },
	{ min: 91, max: 100, precipitation: HeavySnow, duration: "1d6" }
];
export const TorrentialUnfrozenPrecipitation: PrecipitationTableItem[] = [
	{ min: 1, max: 5, precipitation: HeavyFog, duration: "1d8" },
	{ min: 6, max: 10, precipitation: HeavyFog, duration: "2d6" },
	{ min: 11, max: 30, precipitation: HeavyRain, duration: "2d6" },
	{ min: 31, max: 60, precipitation: HeavyRain, duration: "2d12" },
	{ min: 61, max: 80, precipitation: `${HeavyRain}|${Sleet}`, duration: "2d6" },
	{ min: 81, max: 95, precipitation: Thunderstorm, duration: "1d3" },
	{ min: 96, max: 100, precipitation: Thunderstorm, duration: "1d6" }
];
export const TorrentialFrozenPrecipitation: PrecipitationTableItem[] = [
	{ min: 1, max: 5, precipitation: HeavyFog, duration: "1d8" },
	{ min: 6, max: 10, precipitation: HeavyFog, duration: "2d6" },
	{ min: 11, max: 50, precipitation: HeavySnow, duration: "1d4" },
	{ min: 51, max: 90, precipitation: HeavySnow, duration: "1d8" },
	{ min: 91, max: 100, precipitation: HeavySnow, duration: "2d12" }
];

export interface WindTableItem extends TableItem {
	strength: keyof typeof WindType;
	speed: SimpleDice;
}
export const ThunderstormWinds: WindTableItem[] = [
	{ min: 1, max: 50, strength: "Strong", speed: "1d10+20" },
	{ min: 51, max: 90, strength: "Severe", speed: "1d20+30" },
	{ min: 91, max: 100, strength: "Windstorm", speed: "1d25+50" }
];
export const WindStrength: WindTableItem[] = [
	{ min: 1, max: 50, strength: "Light", speed: "1d11-1" },
	{ min: 51, max: 80, strength: "Moderate", speed: "1d10+10" },
	{ min: 81, max: 90, strength: "Strong", speed: "1d10+20" },
	{ min: 91, max: 95, strength: "Severe", speed: "1d20+30" },
	{ min: 96, max: 100, strength: "Windstorm", speed: "1d25+50" }
];

export interface CloudCoverTableItem extends TableItem {
	cloudCover: string;
}
export const CloudCover: CloudCoverTableItem[] = [
	{ min: 1, max: 50, cloudCover: "None" },
	{ min: 51, max: 70, cloudCover: "Light" },
	{ min: 71, max: 85, cloudCover: "Medium" },
	{ min: 86, max: 100, cloudCover: "Overcast" }
];

const tables: WeatherTables = {
	ColdRegionTemperatureVariations: ColdRegionTemperatureVariations,
	TemperateRegionTemperatureVariations: TemperateRegionTemperatureVariations,
	TropicalRegionTemperatureVariations: TropicalRegionTemperatureVariations,

	LightUnfrozenPrecipitation: LightUnfrozenPrecipitation,
	LightFrozenPrecipitation: LightFrozenPrecipitation,
	MediumUnfrozenPrecipitation: MediumUnfrozenPrecipitation,
	MediumFrozenPrecipitation: MediumFrozenPrecipitation,
	HeavyUnfrozenPrecipitation: HeavyUnfrozenPrecipitation,
	HeavyFrozenPrecipitation: HeavyFrozenPrecipitation,
	TorrentialUnfrozenPrecipitation: TorrentialUnfrozenPrecipitation,
	TorrentialFrozenPrecipitation: TorrentialFrozenPrecipitation,

	ThunderstormWinds: ThunderstormWinds,
	WindStrength: WindStrength,

	CloudCover: CloudCover
};
