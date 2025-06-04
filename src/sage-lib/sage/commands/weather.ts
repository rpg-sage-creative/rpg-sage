import { Season, TemperateSeason, TropicalSeason, capitalize, fahrenheitToCelsius, getTemperateSeason, getTropicalSeason, isDefined, parseEnum, type Args, type EnumLike, type RenderableContent } from "@rsc-utils/core-utils";
import { AttachmentBuilder } from "discord.js";
import { GDate } from "../../../sage-cal/pf2e/GDate.js";
import { ClimateType, CloudCoverType, ElevationType, WeatherGenerator, WindType, type IWeatherDayResult } from "../../../sage-pf2e/index.js";
import type { ExportDelimiter } from "../../../sage-pf2e/weather/WeatherGenerator.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { SageCommand } from "../model/SageCommand.js";
import { createCommandRenderableContent } from "./cmd.js";

/** Single object to hold the args */
type WeatherArgs = {
	climateType: ClimateType;
	elevationType: ElevationType;
	seasonType: Season
};

/** Parses the raw values into valid combinations or defualts. */
function parseWeatherArgs({ climateType, elevationType, seasonType }: Args<WeatherArgs>): WeatherArgs {
	// we default to lowland
	elevationType = elevationType ?? ElevationType.Lowland;

	// if we don't have a climate, set a default
	if (!isDefined(climateType)) {
		if (isDefined(seasonType)) {
			// if we have a season, default to a valid climate based on season
			climateType = [Season.Dry, Season.Wet].includes(seasonType) ? ClimateType.Tropical : ClimateType.Temperate;
		}else {
			// default to temperate otherwise
			climateType = ClimateType.Temperate;
		}
	}

	// ensure we have a valid season / climate combo
	seasonType = climateType === ClimateType.Tropical
		// use given season if valid for tropical, or get current tropical season
		? parseEnum<Season>(TropicalSeason, seasonType) ?? getTropicalSeason() as unknown as Season
		// use given season if valid for temperate, or get current temperate season
		: parseEnum<Season>(TemperateSeason, seasonType) ?? getTemperateSeason() as unknown as Season;

	return { climateType, elevationType, seasonType };
}

/** Gets a GDate that falls within the given climate/season combo */
function getGDate({ climateType, seasonType }: WeatherArgs): GDate | undefined {
	const date = new Date();
	for (let month = 0; month < 12; month++) {
		date.setMonth(month);
		const monthSeason = climateType === ClimateType.Tropical
			? getTropicalSeason(date) as unknown as Season
			: getTemperateSeason(date) as unknown as Season;
		if (monthSeason === seasonType) {
			return new GDate(month, 1);
		}
	}
	return undefined;
}

/** Randomize the weather based on the arguments */
function createWeatherRenderable(args: WeatherArgs): RenderableContent {
	const { climateType, elevationType, seasonType } = args;
	const gDate = getGDate(args);
	const generator = new WeatherGenerator(climateType, elevationType, gDate);
	const today = generator.createToday();
	const content = createCommandRenderableContent();
	content.setTitle(`<b>Random Weather</b>`);
	content.append(...[
		`<b>Climate</b> ${ClimateType[climateType]}`,
		`<b>Elevation</b> ${ElevationType[elevationType]}`,
		`<b>Season</b> ${Season[seasonType]}`,
		`<b>High</b> ${today.high} °F (${fahrenheitToCelsius(today.high)} °C)`,
		`<b>Low</b> ${today.low} °F (${fahrenheitToCelsius(today.low)} °C)`,
		`<b>Cloud Cover</b> ${CloudCoverType[today.cloudCover] ?? "None"}`,
		`<b>Precipitation</b> ${today.precipItem?.precipitation ?? "None"}`,
		`<b>Wind</b> ${WindType[today.windStrength!] ?? "None"}`
	]);
	return content;
}

type Time = "day" | "week" | "month" | "year";
async function exportWeather(sageCommand: SageCommand, args: WeatherArgs, time: Time, delimiter: ExportDelimiter): Promise<void> {
	const { climateType, elevationType } = args;
	const gDate = getGDate(args);
	const generator = new WeatherGenerator(climateType, elevationType, gDate);
	let days: IWeatherDayResult[] = [];
	switch(time) {
		case "day":
			days[0] = generator.createToday();
			break;
		case "week":
			days = generator.createNextWeek();
			break;
		case "month":
			days = generator.createNextMonth();
			break;
		case "year":
			days = generator.createYear();
			break;
		default:
			await sageCommand.whisper("Sorry, something went wrong.");
			return;
	}
	const raw = WeatherGenerator.createExport(days, delimiter);
	const ext = delimiter === "," ? "csv" : "tsv";
	const name = `RPGSage-RandomWeather-${capitalize(time)}.${ext}`;
	const attachment = new AttachmentBuilder(Buffer.from(raw), { name });
	await sageCommand.replyStack.reply({ content:"Here is your weather!", files:[attachment] });
}

//#region slash command

/** Checks the command for the arg/enum to either process or alert of an issue. */
function getEnumInfo<K extends string = string, V extends number = number>(sageCommand: SageCommand, enumType: EnumLike<K, V>, key: string) {

	const keyValue = sageCommand.args.getEnum(enumType, key);
	const hasKeyValue = keyValue !== undefined;

	let nonKeyValue: V | undefined;
	let hasNonKeyValue = false;
	if (sageCommand.isSageMessage()) {
		nonKeyValue = sageCommand.args.manager.enumValues(enumType)[0];
		hasNonKeyValue = nonKeyValue !== undefined;
	}

	const value = keyValue ?? nonKeyValue;

	const isInvalid = keyValue === null || hasKeyValue && hasNonKeyValue;

	return { hasKeyValue, keyValue, hasNonKeyValue, nonKeyValue, value, isInvalid };
}

/** Gets the help text used by both types of commands. */
function getHelpText(): string {
	return [
		"The slash command for creating random weather is:",
		"```/sage-weather```",
		"The message command for creating random weather is:",
		"```sage! weather climate=\"\" elevation=\"\" season=\"\"```",
		"Climate, elevation, and season are optional, for example:",
		"```",
		"sage! weather",
		"sage! weather climate=\"tropical\"",
		"sage! weather climate=\"temperate\" season=\"winter\"",
		"```",
		"The valid climate, elevation, and season values are:",
		"- **Climate:** `Cold`, `Temperate`, `Tropical`",
		"- **Elevation:** `SeaLevel`, `Lowland`, `Highland`",
		"- **Season (Cold/Temperate):** `Winter`, `Spring`, `Summer`, `Fall`",
		"- **Season (Tropical):** `Wet`, `Dry`",
		"\nThe default climate, elevation, and season values are:",
		"- **Climate:** `Temperate`",
		"- **Elevation:** `Lowland`",
		"- **Season:** *based on current date in northern hemisphere*",
	].join("\n");
}

/** Renders the help text in chat. */
async function showHelp(sageCommand: SageCommand): Promise<void> {
	await sageCommand.whisper(getHelpText());
}

/** Handles the Weather commands */
async function weatherHandler(sageCommand: SageCommand): Promise<void> {
	const climateInfo = getEnumInfo(sageCommand, ClimateType, "climate");
	const elevationInfo = getEnumInfo(sageCommand, ElevationType, "elevation");
	const seasonInfo = getEnumInfo(sageCommand, Season, "season");

	if (sageCommand.isSageMessage() && (climateInfo.isInvalid || elevationInfo.isInvalid || seasonInfo.isInvalid)) {
		await sageCommand.whisperWikiHelp({ message:"For Help, try\n```sage! weather help```... or ...", page:"Weather" });

	}else {
		const climateType = climateInfo.value;
		const elevationType = elevationInfo.value;
		const seasonType = seasonInfo.value;
		const args = parseWeatherArgs({ climateType, elevationType, seasonType });

		const timeArg = sageCommand.args.getString("export")?.toLowerCase();
		const time = ["day", "week", "month", "year"].find(s => s === timeArg) as "year";
		if (time) {
			const delimiterArg = sageCommand.args.getString("delimiter");
			const delimiter = [",", "|", "\t"].find(s => s === delimiterArg) as "\t" ?? "\t";
			await exportWeather(sageCommand, args, time, delimiter);

		}else {
			const renderable = createWeatherRenderable(args);
			await sageCommand.reply(renderable, false);
		}

	}
}

//#endregion

export function registerCommandHandlers(): void {
	registerListeners({ commands:["weather"], interaction:weatherHandler, message:weatherHandler });
	registerListeners({ commands:["weather|help"], message:showHelp });
}
