import { HasIdCore, type IdCore } from "@rsc-utils/class-utils";
import { partition } from "@rsc-utils/core-utils";
import type { IMapLocation } from "../map/map.js";
import type { IWeatherDayResult } from "./WeatherGenerator.js";

export interface WeatherCalendarCore extends IdCore<"WeatherCalendar"> {
	data: IWeatherDayResult[];
	name: string;
	location: IMapLocation;
}
export class WeatherCalendar extends HasIdCore<WeatherCalendarCore> {

	public get name() { return this.core?.name ?? null; }
	public get location() { return this.core?.location ?? null; }
	public get data() { return this.core?.data ?? []; }

	public get all() { return this.data.slice(); }
	public get months() { return partition(this.data, t => t.date.monthType); }
	public get tempeateSeasons() { return partition(this.data, t => t.date.temperateSeasonType); }
	public get tropicalSeasons() { return partition(this.data, t => t.date.tropicalSeasonType); }
}
