import { Climate, CloudCover, Elevation, WeatherGenerator, Wind } from "../../../sage-pf2e/weather";
import type { Optional } from "../../../sage-utils";
import { Season, TemperateSeason, TropicalSeason } from "../../../sage-utils/DateUtils";
import { getTemperateSeason, getTropicalSeason } from "../../../sage-utils/DateUtils";
import { parse } from "../../../sage-utils/EnumUtils";
import type { RenderableContent } from "../../../sage-utils/RenderUtils";
import { fahrenheitToCelsius } from "../../../sage-utils/TemperatureUtils";
import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types";
import { registerInteractionListener } from "../../discord/handlers";
import type { SageInteraction } from "../model/SageInteraction";
import type { SageMessage } from "../model/SageMessage";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";

type TWeatherArgs = {
	climateType: Climate;
	elevationType: Elevation;
	seasonType: Season
};

function parseWeatherArgs(climate: Optional<string>, elevation: Optional<string>, season: Optional<string>): TWeatherArgs {
	const elevationType = parse(Elevation, elevation!) ?? Elevation.Lowland;
	let climateType = parse(Climate, climate!);
	let seasonType = parse(Season, season!);
	if (climateType === undefined && seasonType !== undefined) {
		climateType = [Season.Dry, Season.Wet].includes(seasonType) ? Climate.Tropical : Climate.Temperate;
	}else if (climateType === undefined) {
		climateType = Climate.Temperate;
	}
	if (seasonType === undefined) {
		seasonType = climateType === Climate.Tropical
			? parse(TropicalSeason, climate!) as unknown as Season ?? getTropicalSeason() as unknown as Season
			: parse(TemperateSeason, climate!) as unknown as Season ?? getTemperateSeason() as unknown as Season;
	}
	return { climateType, elevationType, seasonType };
}

async function weatherRandom(sageMessage: SageMessage): Promise<void> {
	const climate = Climate[sageMessage.args.findEnum(Climate, "climate", true)!];
	const elevation = Elevation[sageMessage.args.findEnum(Elevation, "elevation", true)!];
	const season = Season[sageMessage.args.findEnum(Season, "season", true)!];
	const args = parseWeatherArgs(climate, elevation, season);
	const renderable = createWeatherRenderable(args);
	return <any>sageMessage.send(renderable);
}

function createWeatherRenderable({ climateType, elevationType, seasonType }: TWeatherArgs): RenderableContent {
	const generator = new WeatherGenerator(climateType, elevationType);
	const today = generator.createToday();
	const content = createCommandRenderableContent();
	content.setTitle(`<b>Random Weather</b>`);
	content.append(...[
		`<b>Climate</b> ${Climate[climateType]}`,
		`<b>Elevation</b> ${Elevation[elevationType]}`,
		`<b>Season</b> ${Season[seasonType]}`,
		`<b>High</b> ${today.high} °F (${fahrenheitToCelsius(today.high)} °C)`,
		`<b>Low</b> ${today.low} °F (${fahrenheitToCelsius(today.low)} °C)`,
		`<b>Cloud Cover</b> ${CloudCover[today.cloudCover] ?? "None"}`,
		`<b>Precipitation</b> ${today.precipItem?.precipitation ?? "None"}`,
		`<b>Wind</b> ${Wind[today.windStrength!] ?? "None"}`
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