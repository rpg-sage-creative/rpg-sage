import { SeasonType } from "../../sage-utils";
import { random } from "../../sage-utils/utils/RandomUtils";

export enum ElevationType { SeaLevel, Lowland, Highland }
export enum ClimateType { Cold, Temperate, Tropical }
export enum PrecipitationFrequencyType { Drought, Rare, Intermittent, Common, Constant }
export enum PrecipitationIntensityType { Light, Medium, Heavy, Torrential }
export enum CloudCoverType { None, Light, Medium, Overcast }
export enum WindType { Light, Moderate, Strong, Severe, Windstorm }

/** [SeaLevel, Lowland, Highland] */
export const ElevationTypes = [ElevationType.SeaLevel, ElevationType.Lowland, ElevationType.Highland];
/** [Cold, Temperate, Tropical] */
export const ClimateTypes = [ClimateType.Cold, ClimateType.Temperate, ClimateType.Tropical];
/** [Winter, Spring, Summer, Fall] */
export const SeasonTypes = [SeasonType.Winter, SeasonType.Spring, SeasonType.Summer, SeasonType.Fall];
/** usage: BaselineTemps[ClimateTypes.indexOf(climateType)][SeasonTypes.indexOf(seasonType)] */
export const BaselineTemps = [[20, 30, 40, 30], [30, 60, 80, 60], [50, 75, 95, 75]];

export function getBasePrecipitationFrequency(climate: ClimateType, season: SeasonType, elevation: ElevationType): PrecipitationFrequencyType {
	let frequency: PrecipitationFrequencyType = 0;
	switch (season) {
		case SeasonType.Fall:
		case SeasonType.Spring:
			frequency = climate === ClimateType.Tropical ? PrecipitationFrequencyType.Common : PrecipitationFrequencyType.Intermittent;
			break;
		case SeasonType.Summer:
			frequency = climate === ClimateType.Tropical ? PrecipitationFrequencyType.Intermittent : PrecipitationFrequencyType.Common;
			break;
		case SeasonType.Winter:
			frequency = PrecipitationFrequencyType.Rare;
			break;
		default:
			console.error("getBasePrecipitationFrequency: " + season);
			break;
	}
	// desert, Drought (Rare a few weeks a year)
	// if (climate == ClimateType.Cold) frequency--;
	if (elevation === ElevationType.Highland) {
		frequency--;
	}
	if (frequency < PrecipitationFrequencyType.Drought) {
		return PrecipitationFrequencyType.Drought;
	}else if (frequency > PrecipitationFrequencyType.Constant) {
		return PrecipitationFrequencyType.Constant;
	}else {
		return frequency;
	}
}

export function getBasePrecipitationIntensity(climate: ClimateType, _: SeasonType, elevation: ElevationType): PrecipitationIntensityType {
	let intensity = PrecipitationIntensityType.Medium;
	if (elevation === ElevationType.SeaLevel) {
		intensity = PrecipitationIntensityType.Heavy;
	}
	if (climate === ClimateType.Cold) {
		intensity--;
	}
	else if (climate === ClimateType.Tropical) {
		intensity++;
	}
	if (intensity < PrecipitationIntensityType.Light) {
		return PrecipitationIntensityType.Light;
	}else if (intensity > PrecipitationIntensityType.Torrential) {
		return PrecipitationIntensityType.Torrential;
	}else {
		return intensity;
	}
}

export function getBaseTemp(climate: ClimateType, season: SeasonType, elevation: ElevationType): number {
	const climateIndex = ClimateTypes.indexOf(climate);
	const seasonIndex = SeasonTypes.indexOf(season);
	let temp = BaselineTemps[climateIndex][seasonIndex];
	if (elevation === ElevationType.SeaLevel) {
		temp += 10;
	}else if (elevation === ElevationType.Highland) {
		temp -= 10;
	}
	// 0 - 250 miles of poles, -20
	// 251 - 500 miles of poles, -10
	return temp;
}

export function testForPrecipitation(frequency: PrecipitationFrequencyType): boolean {
	const roll = random(100);
	switch (frequency) {
		case PrecipitationFrequencyType.Drought: return roll <= 5;
		case PrecipitationFrequencyType.Rare: return roll <= 15;
		case PrecipitationFrequencyType.Intermittent: return roll <= 30;
		case PrecipitationFrequencyType.Common: return roll <= 60;
		case PrecipitationFrequencyType.Constant: return roll <= 95;
		default:
			console.error("testforPrecipitation: " + frequency);
			return false;
	}
}
