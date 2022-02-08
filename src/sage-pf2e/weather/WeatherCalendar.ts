import utils, { IdCore } from "../../sage-utils";
import type { IMapLocation } from "../map/map";
import type { IWeatherDayResult } from "./WeatherGenerator";

export interface WeatherCalendarCore extends IdCore<"WeatherCalendar"> {
	data: IWeatherDayResult[];
	name: string;
	location: IMapLocation;
}
export default class WeatherCalendar extends utils.ClassUtils.HasIdCore<WeatherCalendarCore> {

	public get name() { return this.core && this.core.name || null; }
	public get location() { return this.core && this.core.location || null; }
	public get data() { return this.core && this.core.data || []; }

	public get all() { return this.data.slice(); }
	public get months() { return utils.ArrayUtils.Collection.partition(this.data, t => t.date.monthType); }
	public get tempeateSeasons() { return utils.ArrayUtils.Collection.partition(this.data, t => t.date.temperateSeasonType); }
	public get tropicalSeasons() { return utils.ArrayUtils.Collection.partition(this.data, t => t.date.tropicalSeasonType); }
}
