import utils, { Optional, SeasonType, TemperateSeasonType, TropicalSeasonType } from "../../../sage-utils";
import { ClimateType, CloudCoverType, ElevationType, WindType, WeatherGenerator } from "../../../sage-pf2e";
import type SageMessage from "../model/SageMessage";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";
import type SageInteraction from "../model/SageInteraction";
import type { TSlashCommand } from "../../../slash.mjs";
import { registerInteractionListener } from "../../discord/handlers";

type TWeatherArgs = {
	climateType: ClimateType;
	elevationType: ElevationType;
	seasonType: SeasonType
};

function parseWeatherArgs(climate: Optional<string>, elevation: Optional<string>, season: Optional<string>): TWeatherArgs {
	const elevationType = utils.EnumUtils.parse<ElevationType>(ElevationType, elevation!) ?? ElevationType.Lowland;
	let climateType = utils.EnumUtils.parse<ClimateType>(ClimateType, climate!);
	let seasonType = utils.EnumUtils.parse<SeasonType>(SeasonType, season!);
	if (climateType === undefined && seasonType !== undefined) {
		climateType = [SeasonType.Dry, SeasonType.Wet].includes(seasonType) ? ClimateType.Tropical : ClimateType.Temperate;
	}else if (climateType === undefined) {
		climateType = ClimateType.Temperate;
	}
	if (seasonType === undefined) {
		seasonType = climateType === ClimateType.Tropical
			? utils.EnumUtils.parse<SeasonType>(TropicalSeasonType, climate!) ?? utils.DateUtils.getTropicalSeason() as unknown as SeasonType
			: utils.EnumUtils.parse<SeasonType>(TemperateSeasonType, climate!) ?? utils.DateUtils.getTemperateSeason() as unknown as SeasonType;
	}
	return { climateType, elevationType, seasonType };
}

async function weatherRandom(sageMessage: SageMessage): Promise<void> {
	const climate = ClimateType[sageMessage.args.removeAndReturnEnum<ClimateType>(ClimateType, true)!];
	const elevation = ElevationType[sageMessage.args.removeAndReturnEnum<ElevationType>(ElevationType, true)!];
	const season = SeasonType[sageMessage.args.removeAndReturnEnum<SeasonType>(SeasonType, true)!];
	const args = parseWeatherArgs(climate, elevation, season);
	const renderable = createWeatherRenderable(args);
	return <any>sageMessage.send(renderable);
}

function createWeatherRenderable({ climateType, elevationType, seasonType }: TWeatherArgs): utils.RenderUtils.RenderableContent {
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
	return content;
}

//#region slash command

function slashTester(sageInteraction: SageInteraction): boolean {
	return sageInteraction.interaction.commandName === "weather";
}

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	const climate = sageInteraction.getString("climate");
	const elevation = sageInteraction.getString("elevation");
	const season = sageInteraction.getString("season");
	const args = parseWeatherArgs(climate, elevation, season);
	const renderable = createWeatherRenderable(args);
	return sageInteraction.reply(renderable, false);
}

//#endregion

export function weatherCommand(): TSlashCommand {
	return {
		name: "weather",
		description: "Create random weather reports.",
		options: [
			{ name:"climate", description:"Cold, Temperate, Tropical", choices:["Cold", "Temperate", "Tropical"] },
			{ name:"elevation", description:"SeaLevel, Lowland, Highland", choices:["SeaLevel", "Lowland", "Highland"] },
			{ name:"season", description:"Temperate: Spring, Summer, Fall, Winter; Tropical: Wet, Dry", choices:["Spring", "Summer", "Fall", "Winter", "Wet", "Dry"] },
		]
	};
}

export default function register(): void {
	registerCommandRegex(/^\s*weather(?:\s+(\w+))?(?:\s+(\w+))?(?:\s+(\w+))?/i, weatherRandom);
	registerCommandHelp("Command", "Weather", `weather {climate} {elevation} {season}\n - Climate Options: Cold | Temperate | Tropical\n - Elevation Options: SeaLevel | Lowland | Highland\n - Season Options: Spring | Summer | Fall | Winter\n<b>[permission-patreon] Patron Feature (Trusted)</b>`);
	registerInteractionListener(slashTester, slashHandler);
}