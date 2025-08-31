import { ClimateType, ElevationType } from "../weather/weather.js";

export interface IMapLocation {
	name: string;
	latitude: number;
	longitude: number;
	tzOffset: number;
	elevation: ElevationType;
	climate: ClimateType;
}

//Sacramento: 38.5816° N, 121.4944° W
export const KnownLocations: IMapLocation[] = [
	{ name: "Absalom", latitude: 36, longitude: 0, tzOffset: 60, elevation: ElevationType.SeaLevel, climate: ClimateType.Temperate }
];
/*
// if (location && location.href.includes("localhost")) {
// 	KnownLocations.unshift({ name:"Sacramento", latitude:38.5816, longitude:121.4944, tzOffset:-480, elevation:weather.ElevationType.SeaLevel, climate:weather.ClimateType.Temperate });
// }
*/
