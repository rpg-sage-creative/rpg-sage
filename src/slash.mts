import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandNumberOption, SlashCommandBooleanOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import type { IBotCore } from "./sage-lib/sage/model/Bot";
import utils, { Optional } from "./sage-utils";
import { registerSlashCommands } from "./sage-lib/sage/commands";
import type { TNameDescription, TSlashCommand, TSlashCommandChoice, TSlashCommandOption } from "./types";
import type { TGameType } from "./sage-dice";

type TBot = "dev" | "beta" | "stable";

const nodeArgs = process.argv.slice(2),
	botCodeName = ["dev","beta","stable"].find(s => nodeArgs.includes(s)) as TBot ?? "dev",
	isUpdate = nodeArgs.includes("update"),
	isWipe = nodeArgs.includes("wipe");

let characterCount = 0;

const botJson = utils.FsUtils.listFilesSync("./data/sage/bots")
	.map(file => utils.FsUtils.readJsonFileSync<IBotCore>(`./data/sage/bots/${file}`))
	.find(json => json?.codeName === botCodeName);

//#region Register Slash Commands

const allSlashCommands = [] as TSlashCommand[];

/** Allows a SlashCommand to be registered so that it can be built */
export function registerSlashCommand(...slashCommands: TSlashCommand[]): void;
export function registerSlashCommand(gameType: TGameType, ...slashCommands: TSlashCommand[]): void;
export function registerSlashCommand(...args: (TGameType | TSlashCommand)[]): void {
	const gameType = args.find(arg => typeof(arg) === "string");
	const slashCommands = args.filter(arg => typeof(arg) !== "string") as TSlashCommand[];
	if (gameType) {
		let gameGroup = allSlashCommands.find(cmd => cmd.game === gameType);
		if (!gameGroup) {
			gameGroup = { name:gameType as string, description:`Commands specific to ${gameType}`, children:[] };
			allSlashCommands.push(gameGroup);
		}
		gameGroup.children!.push(...slashCommands);
	}else {
		allSlashCommands.push(...slashCommands);
	}
}

// registers SlashCommands
registerSlashCommands();

//#endregion

//#region command builders

/** Makes sure no matter how i give/set the choice it converts to what the API needs. */
function toChoice(choice: TSlashCommandChoice): [string, string] {
	if (Array.isArray(choice)) {
		return [choice[0], choice[1]];
	}
	if (typeof(choice) === "string") {
		return [choice, choice];
	}
	return [choice.name, choice.value ?? choice.name];
}

/** shortcut for setting name/desc on all objects, also cleans the name for the API */
type TBuilder = SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder;
type TBuilderCommand = SlashCommandBuilder | SlashCommandSubcommandBuilder;
type TBuilderOption = SlashCommandStringOption | SlashCommandBooleanOption | SlashCommandNumberOption;
type TBuilderOrOption = TBuilder | TBuilderOption;
function isBuilder<T extends TBuilderOrOption>(builder: T): boolean {
	return builder instanceof SlashCommandBuilder
		|| builder instanceof SlashCommandSubcommandBuilder
		|| builder instanceof SlashCommandSubcommandGroupBuilder;
}
function setName<T extends TBuilderOrOption>(builder: T, hasName: TNameDescription): T {
	try {
		builder.setName(isBuilder(builder) ? hasName.name.toLowerCase() : hasName.name);
		builder.setDescription(hasName.description ?? builder.name);
		characterCount += builder.name.length + builder.description.length;
	}catch(ex) {
		console.error(`${hasName.name}: ${hasName.description}`);
	}
	return builder;
}
function setNameAndRequired<T extends TBuilderOption>(opt: T, option: TSlashCommandOption): T {
	setName(opt, option);
	opt.setRequired(option.isRequired === true);
	return opt;
}
function isValidNumber<T extends number>(value: Optional<T>): value is T {
	return typeof(value) === "number" && !isNaN(value);
}
function setMinMaxValues<T extends SlashCommandNumberOption>(opt: T, option: TSlashCommandOption): T {
	if (isValidNumber(option.minValue)) {
		opt.setMinValue(option.minValue);
	}
	if (isValidNumber(option.maxValue)) {
		opt.setMaxValue(option.maxValue);
	}
	return opt;
}

/** shortcut for setting options all things that allow options */
function addOptions<T extends TBuilderCommand>(builder: T, options?: TSlashCommandOption[]): T {
	options?.forEach(option => {
		if (option.isBoolean) {
			builder.addBooleanOption(opt => setNameAndRequired(opt, option));
		}else if (option.isNumber) {
			builder.addNumberOption(opt => {
				setNameAndRequired(opt, option);
				setMinMaxValues(opt, option);
				return opt;
			});
		}else {
			builder.addStringOption(opt => {
				setNameAndRequired(opt, option);
				option.choices?.forEach(choice => {
					const [name, value] = toChoice(choice);
					characterCount += name.length + value.length;
					opt.addChoice(name, value);
				});
				return opt;
			});
		}
		return builder;
	}
	);
	return builder;
}

/** shortcut for setting subcommands where they are allowed */
function addSubcommands<T extends SlashCommandBuilder | SlashCommandSubcommandGroupBuilder>(builder: T, commands?: TSlashCommand[]): T {
	commands?.forEach(command =>
		builder.addSubcommand(sub =>
			addOptions(setName(sub, command), command.options)
		)
	);
	return builder;
}

function buildCommand(raw: TSlashCommand): SlashCommandBuilder {
	const cmd = setName(new SlashCommandBuilder(), raw);
	raw.children?.forEach(child => {
		if (child.children?.length) {
			cmd.addSubcommandGroup(grp =>
				addSubcommands(setName(grp, child), child.children)
			);
		}else {
			cmd.addSubcommand(sub =>
				addOptions(setName(sub, child), child.options)
			);
		}
	});
	addOptions(cmd, raw.options);
	return cmd;
}

function buildUnifiedCommand(): SlashCommandBuilder[] {
	const command = { name:"Sage", description:"RPG Sage Commands", children:allSlashCommands };
	return [buildCommand(command)];
}
function buildIndividualCommands(): SlashCommandBuilder[] {
	return allSlashCommands.map(buildCommand);
}
function buildCommands(): SlashCommandBuilder[] {
	return true ? buildUnifiedCommand() : buildIndividualCommands();
}

//#endregion

async function updateSlashCommands(bot: IBotCore): Promise<void> {
	const rest = new REST({version: '9'}).setToken(bot.token);
	try {
		console.log(`Started refreshing application (/) commands for: ${botCodeName}`);

		await rest.put(Routes.applicationCommands(bot.did), {
			body: buildCommands()
		});

		console.log(`Successfully reloaded application (/) commands for: ${botCodeName}.`);
	} catch (error) {
		console.error(Object.keys(error as any));
	}
}
async function wipeSlashCommands(bot: IBotCore): Promise<void> {
	const rest = new REST({version: '9'}).setToken(bot.token);
	try {
		console.log(`Started wiping application (/) commands for: ${botCodeName}`);

		await rest.put(Routes.applicationCommands(bot.did), {
			body: []
		});

		console.log(`Successfully wiped application (/) commands for: ${botCodeName}.`);
	} catch (error) {
		console.error(Object.keys(error as any));
	}
}

//#region EXECUTE THE LOGIC HERE: error out w/o bot, or run desired logic of: build, update, wipe
if (!botJson) {
	console.error(`Unable to find Bot: ${botCodeName}`);
}else {
	if (isUpdate) {
		updateSlashCommands(botJson);
	}else if (isWipe) {
		wipeSlashCommands(botJson);
	}else {
		try {
			const built = buildCommands();
			utils.FsUtils.writeFileSync(`../data/slash/${botCodeName}.json`, built, true, true);
			console.log(`Slash Commands built for ${botCodeName}: ${built.length} commands; ${characterCount} characters`);
		}catch(ex) {
			console.error(ex);
		}
	}
}
//#endregion

// node --experimental-modules --es-module-specifier-resolution=node slash.mjs