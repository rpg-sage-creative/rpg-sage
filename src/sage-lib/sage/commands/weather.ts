import { ClimateType, CloudCoverType, ElevationType, WeatherGenerator, WindType } from "../../../sage-pf2e";
import utils, { Optional, SeasonType, TemperateSeasonType, TropicalSeasonType } from "../../../sage-utils";
import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types";
import { registerInteractionListener } from "../../discord/handlers";
import type SageInteraction from "../model/SageInteraction";
import type SageMessage from "../model/SageMessage";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";

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
	const climate = ClimateType[sageMessage.args.findEnum<ClimateType>(ClimateType, "climate", true)!];
	const elevation = ElevationType[sageMessage.args.findEnum<ElevationType>(ElevationType, "elevation", true)!];
	const season = SeasonType[sageMessage.args.findEnum<SeasonType>(SeasonType, "season", true)!];
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
		`<b>High</b> ${today.high} °F (${utils.TempUtils.fahrenheitToCelsius(today.high)} °C)`,
		`<b>Low</b> ${today.low} °F (${utils.TempUtils.fahrenheitToCelsius(today.low)} °C)`,
		`<b>Cloud Cover</b> ${CloudCoverType[today.cloudCover] ?? "None"}`,
		`<b>Precipitation</b> ${today.precipItem?.precipitation ?? "None"}`,
		`<b>Wind</b> ${WindType[today.windStrength!] ?? "None"}`
	]);
	return content;
}

//#region slash command

function slashTester(sageInteraction: SageInteraction): boolean {
	return sageInteraction.isCommand("Weather");
}

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	const climate = sageInteraction.args.getString("climate");
	const elevation = sageInteraction.args.getString("elevation");
	const season = sageInteraction.args.getString("season");
	const args = parseWeatherArgs(climate, elevation, season);
	const renderable = createWeatherRenderable(args);
	return sageInteraction.reply(renderable, false);
}

function weatherCommand(): TSlashCommand {
	return {
		name: "Weather",
		description: "Create random weather reports.",
		options: [
			{ name:"climate", description:"Cold, Temperate, Tropical", choices:["Cold", "Temperate", "Tropical"] },
			{ name:"elevation", description:"SeaLevel, Lowland, Highland", choices:["SeaLevel", "Lowland", "Highland"] },
			{ name:"season", description:"Temperate: Spring, Summer, Fall, Winter; Tropical: Wet, Dry", choices:["Spring", "Summer", "Fall", "Winter", "Wet", "Dry"] }
		]
	};
}

//#endregion

export function registerCommandHandlers(): void {
	registerCommandRegex(/^\s*weather(?:\s+(\w+))?(?:\s+(\w+))?(?:\s+(\w+))?/i, weatherRandom);
	registerCommandHelp("Command", "Weather", `weather {climate} {elevation} {season}\n - Climate Options: Cold | Temperate | Tropical\n - Elevation Options: SeaLevel | Lowland | Highland\n - Season Options: Spring | Summer | Fall | Winter`);
	registerInteractionListener(slashTester, slashHandler);
}

export function registerSlashCommands(): void {
	registerSlashCommand(weatherCommand());
}