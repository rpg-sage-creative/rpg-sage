import { Collection } from "../../sage-utils/ArrayUtils";
import { HasIdCore, IdCore } from "../../sage-utils/ClassUtils";
import type { IMapLocation } from "../map/map";
import type { IWeatherDayResult } from "./WeatherGenerator";

export interface WeatherCalendarCore extends IdCore<"WeatherCalendar"> {
	data: IWeatherDayResult[];
	name: string;
	location: IMapLocation;
}
export class WeatherCalendar extends HasIdCore<WeatherCalendarCore> {

	public get name() { return this.core && this.core.name || null; }
	public get location() { return this.core && this.core.location || null; }
	public get data() { return this.core && this.core.data || []; }

	public get all() { return this.data.slice(); }
	public get months() { return Collection.partition(this.data, t => t.date.month); }
	public get tempeateSeasons() { return Collection.partition(this.data, t => t.date.temperateSeason); }
	public get tropicalSeasons() { return Collection.partition(this.data, t => t.date.tropicalSeason); }
}
