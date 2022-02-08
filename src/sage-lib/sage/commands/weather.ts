import utils, { SeasonType, TemperateSeasonType, TropicalSeasonType } from "../../../sage-utils";
import { ClimateType, CloudCoverType, ElevationType, WindType, WeatherGenerator } from "../../../sage-pf2e";
import type SageMessage from "../model/SageMessage";
import { PatronTierType } from "../model/User";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";

async function weatherRandom(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canUseFeature(PatronTierType.Trusted)) {
		return sageMessage.reactPatreon();
	}
	const elevationType = sageMessage.args.removeAndReturnEnum<ElevationType>(ElevationType, true) ?? ElevationType.Lowland;
	let climateType = sageMessage.args.removeAndReturnEnum<ClimateType>(ClimateType, true);
	let seasonType: SeasonType | TemperateSeasonType | TropicalSeasonType | undefined = sageMessage.args.removeAndReturnEnum<SeasonType>(SeasonType, true);
	if (climateType === undefined && seasonType !== undefined) {
		climateType = [SeasonType.Dry, SeasonType.Wet].includes(seasonType) ? ClimateType.Tropical : ClimateType.Temperate;
	}else {
		climateType = ClimateType.Temperate;
	}
	if (seasonType === undefined) {
		seasonType = climateType === ClimateType.Tropical
			? sageMessage.args.removeAndReturnEnum<TropicalSeasonType>(TropicalSeasonType, true) ?? utils.DateUtils.getTropicalSeason()
			: sageMessage.args.removeAndReturnEnum<TemperateSeasonType>(TemperateSeasonType, true) ?? utils.DateUtils.getTemperateSeason();
	}
	const generator = new WeatherGenerator(climateType, elevationType);
	const today = generator.createToday();
	const content = createCommandRenderableContent();
	content.setTitle(`<b>Random Weather</b>`);
	content.append(...[
		`<b>Climate</b> ${ClimateType[climateType]}`,
		`<b>Elevation</b> ${ElevationType[elevationType]}`,
		`<b>Season</b> ${SeasonType[seasonType]}`,
		`<b>High</b> ${today.high} F (${utils.TempUtils.fahrenheitToCelsius(today.high)} C)`,
		`<b>Low</b> ${today.low} F (${utils.TempUtils.fahrenheitToCelsius(today.low)} C)`,
		`<b>Cloud Cover</b> ${CloudCoverType[today.cloudCover] ?? "None"}`,
		`<b>Precipitation</b> ${today.precipItem?.precipitation ?? "None"}`,
		`<b>Wind</b> ${WindType[today.windStrength!] ?? "None"}`
	]);
	return <any>sageMessage.send(content);
}

export default function register(): void {
	registerCommandRegex(/^\s*weather(?:\s+(\w+))?(?:\s+(\w+))?(?:\s+(\w+))?/i, weatherRandom);
	registerCommandHelp("Command", "Weather", `weather {climate} {elevation} {season}\n - Climate Options: Cold | Temperate | Tropical\n - Elevation Options: SeaLevel | Lowland | Highland\n - Season Options: Spring | Summer | Fall | Winter\n<b>[permission-patreon] Patron Feature (Trusted)</b>`);
}