import { Season } from "../../sage-utils/DateUtils";
import { random } from "../../sage-utils/RandomUtils";
import { Climate, Elevation, PrecipitationFrequency, PrecipitationIntensity } from "./types";



/** [SeaLevel, Lowland, Highland] */
export const Elevations = [Elevation.SeaLevel, Elevation.Lowland, Elevation.Highland];
/** [Cold, Temperate, Tropical] */
export const Climates = [Climate.Cold, Climate.Temperate, Climate.Tropical];
/** [Winter, Spring, Summer, Fall] */
export const Seasons = [Season.Winter, Season.Spring, Season.Summer, Season.Fall];
/** usage: BaselineTemps[Climates.indexOf(Climate)][Seasons.indexOf(Season)] */
export const BaselineTemps = [[20, 30, 40, 30], [30, 60, 80, 60], [50, 75, 95, 75]];

export function getBasePrecipitationFrequency(climate: Climate, season: Season, elevation: Elevation): PrecipitationFrequency {
	let frequency: PrecipitationFrequency = 0;
	switch (season) {
		case Season.Fall:
		case Season.Spring:
			frequency = climate === Climate.Tropical ? PrecipitationFrequency.Common : PrecipitationFrequency.Intermittent;
			break;
		case Season.Summer:
			frequency = climate === Climate.Tropical ? PrecipitationFrequency.Intermittent : PrecipitationFrequency.Common;
			break;
		case Season.Winter:
			frequency = PrecipitationFrequency.Rare;
			break;
		default:
			console.error("getBasePrecipitationFrequency: " + season);
			break;
	}
	// desert, Drought (Rare a few weeks a year)
	// if (climate == Climate.Cold) frequency--;
	if (elevation === Elevation.Highland) {
		frequency--;
	}
	if (frequency < PrecipitationFrequency.Drought) {
		return PrecipitationFrequency.Drought;
	}else if (frequency > PrecipitationFrequency.Constant) {
		return PrecipitationFrequency.Constant;
	}else {
		return frequency;
	}
}

export function getBasePrecipitationIntensity(climate: Climate, _: Season, elevation: Elevation): PrecipitationIntensity {
	let intensity = PrecipitationIntensity.Medium;
	if (elevation === Elevation.SeaLevel) {
		intensity = PrecipitationIntensity.Heavy;
	}
	if (climate === Climate.Cold) {
		intensity--;
	}
	else if (climate === Climate.Tropical) {
		intensity++;
	}
	if (intensity < PrecipitationIntensity.Light) {
		return PrecipitationIntensity.Light;
	}else if (intensity > PrecipitationIntensity.Torrential) {
		return PrecipitationIntensity.Torrential;
	}else {
		return intensity;
	}
}

export function getBaseTemp(climate: Climate, season: Season, elevation: Elevation): number {
	const climateIndex = Climates.indexOf(climate);
	const seasonIndex = Seasons.indexOf(season);
	let temp = BaselineTemps[climateIndex][seasonIndex];
	if (elevation === Elevation.SeaLevel) {
		temp += 10;
	}else if (elevation === Elevation.Highland) {
		temp -= 10;
	}
	// 0 - 250 miles of poles, -20
	// 251 - 500 miles of poles, -10
	return temp;
}

export function testForPrecipitation(frequency: PrecipitationFrequency): boolean {
	const roll = random(100);
	switch (frequency) {
		case PrecipitationFrequency.Drought: return roll <= 5;
		case PrecipitationFrequency.Rare: return roll <= 15;
		case PrecipitationFrequency.Intermittent: return roll <= 30;
		case PrecipitationFrequency.Common: return roll <= 60;
		case PrecipitationFrequency.Constant: return roll <= 95;
		default:
			console.error("testforPrecipitation: " + frequency);
			return false;
	}
}
