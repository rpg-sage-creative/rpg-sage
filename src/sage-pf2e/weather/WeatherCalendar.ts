import { Collection } from "../../sage-utils/utils/ArrayUtils";
import { HasIdCore, IdCore } from "../../sage-utils/utils/ClassUtils";
import type { IMapLocation } from "../map/map";
import type { IWeatherDayResult } from "./WeatherGenerator";

export interface WeatherCalendarCore extends IdCore<"WeatherCalendar"> {
	data: IWeatherDayResult[];
	name: string;
	location: IMapLocation;
}
export default class WeatherCalendar extends HasIdCore<WeatherCalendarCore> {

	public get name() { return this.core && this.core.name || null; }
	public get location() { return this.core && this.core.location || null; }
	public get data() { return this.core && this.core.data || []; }

	public get all() { return this.data.slice(); }
	public get months() { return Collection.partition(this.data, t => t.date.monthType); }
	public get tempeateSeasons() { return Collection.partition(this.data, t => t.date.temperateSeasonType); }
	public get tropicalSeasons() { return Collection.partition(this.data, t => t.date.tropicalSeasonType); }
}
