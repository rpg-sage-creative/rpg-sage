import { Climate, Elevation } from "../weather";

export interface IMapLocation {
	name: string;
	latitude: number;
	longitude: number;
	tzOffset: number;
	elevation: Elevation;
	climate: Climate;
}

//Sacramento: 38.5816° N, 121.4944° W
export const KnownLocations: IMapLocation[] = [
	{ name: "Absalom", latitude: 36, longitude: 0, tzOffset: 60, elevation: Elevation.SeaLevel, climate: Climate.Temperate }
];
/*
// if (location && location.href.includes("localhost")) {
// 	KnownLocations.unshift({ name:"Sacramento", latitude:38.5816, longitude:121.4944, tzOffset:-480, elevation:weather.ElevationType.SeaLevel, climate:weather.ClimateType.Temperate });
// }
*/
