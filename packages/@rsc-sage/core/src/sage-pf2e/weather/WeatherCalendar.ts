import { Arrayish, HasIdCore, type IdCore } from "@rsc-utils/core-utils";
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
	public get months() { return Arrayish.from(this.data).partition(t => t.date.monthType); }
	public get tempeateSeasons() { return Arrayish.from(this.data).partition(t => t.date.temperateSeasonType); }
	public get tropicalSeasons() { return Arrayish.from(this.data).partition(t => t.date.tropicalSeasonType); }
}
