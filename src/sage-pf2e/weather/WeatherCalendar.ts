import { partition } from "@rsc-utils/array-utils";
import { HasIdCore, IdCore } from "../../sage-utils/utils/ClassUtils";
import type { IMapLocation } from "../map/map";
import type { IWeatherDayResult } from "./WeatherGenerator";

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
