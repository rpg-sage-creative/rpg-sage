import {
	ContextMenuCommandBuilder,
	SlashCommandAttachmentOption,
	SlashCommandBooleanOption,
	SlashCommandBuilder,
	SlashCommandNumberOption,
	SlashCommandStringOption,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder
} from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { getBotCodeName, getDataRoot, type BotCodeName } from "@rsc-utils/env-utils";
import { listFilesSync, readJsonFileSync, writeFileSync } from "@rsc-utils/fs-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { Routes } from "discord-api-types/v9";
import type { SlashCommandGameType, TNameDescription, TSlashCommand, TSlashCommandChoice, TSlashCommandOption } from "./SlashTypes";
import { registerSlashCommands } from "./sage-lib/sage/commands/slash";
import type { IBotCore } from "./sage-lib/sage/model/Bot";

const nodeArgs = process.argv.slice(2),
	isUpdate = nodeArgs.includes("update"),
	isWipe = nodeArgs.includes("wipe");

const botCodeName = getBotCodeName();
const dataPathSage = getDataRoot("sage");

let characterCount = 0;

const botsPath = `${dataPathSage}/bots`;
const botJson = listFilesSync(botsPath)
	.map(file => readJsonFileSync<IBotCore>(`${botsPath}/${file}`))
	.find(json => json?.codeName === botCodeName);

//#region Register Slash Commands

const allSlashCommands = [] as TSlashCommand[];

/** Allows a SlashCommand to be registered so that it can be built */
export function registerSlashCommand(...slashCommands: TSlashCommand[]): void;
export function registerSlashCommand(gameType: SlashCommandGameType, ...slashCommands: TSlashCommand[]): void;
export function registerSlashCommand(...args: (SlashCommandGameType | TSlashCommand)[]): void {
	const defaultGameType = args.find(arg => typeof(arg) === "string") as SlashCommandGameType;
	const slashCommands = args.filter(arg => typeof(arg) !== "string") as TSlashCommand[];
	slashCommands.forEach(slashCommand => {
		const gameType = defaultGameType ?? slashCommand.game;
		if (gameType) {
			let gameGroup = allSlashCommands.find(cmd => cmd.game === gameType || cmd.name === gameType);
			if (!gameGroup) {
				gameGroup = { game:gameType, name:gameType as string, children:[] };
				allSlashCommands.push(gameGroup);
			}
			gameGroup.children!.push(slashCommand);
		}else {
			allSlashCommands.push(slashCommand);
		}
	});
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
type TBuilderOption = SlashCommandAttachmentOption | SlashCommandBooleanOption | SlashCommandNumberOption | SlashCommandStringOption;
type TBuilderOrOption = TBuilder | TBuilderOption;
function setName<T extends TBuilderOrOption>(builder: T, hasName: TNameDescription): T {
	try {
		builder.setName(hasName.name.toLowerCase());
		builder.setDescription(hasName.description ?? hasName.name);
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
		characterCount += String(option.minValue).length;
		opt.setMinValue(option.minValue);
	}
	if (isValidNumber(option.maxValue)) {
		characterCount += String(option.maxValue).length;
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
		}else if (option.isAttachment) {
			builder.addAttachmentOption(opt => {
				setNameAndRequired(opt, option);
				return opt;
			});
		}else {
			builder.addStringOption(opt => {
				setNameAndRequired(opt, option);
				option.choices?.forEach(choice => {
					const [name, value] = toChoice(choice);
					characterCount += name.length + value.length;
					opt.addChoices({ name, value });
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

const ContextMenuCommandTypeMessage = 3;
function buildMapContextMenuCommandBuilder(): ContextMenuCommandBuilder {
	return new ContextMenuCommandBuilder()
		.setName("Add Image")
		.setType(ContextMenuCommandTypeMessage)
		;
}

function buildUnifiedCommand(which: BotCodeName): (SlashCommandBuilder | ContextMenuCommandBuilder)[] {
	const dashWhich = `-${which}`;
	const parenWhich = ` (${which})`;
	const slashCommand = { name:`Sage${which === "stable" ? "" : dashWhich}`, description:`RPG Sage${which === "stable" ? "" : parenWhich} Commands`, children:allSlashCommands };
	const commands = [buildCommand(slashCommand)] as (SlashCommandBuilder | ContextMenuCommandBuilder)[];
	if (botCodeName === "dev" && false) {
		commands.push(buildMapContextMenuCommandBuilder());
	}
	return commands;
}
function buildIndividualCommands(_which: BotCodeName): SlashCommandBuilder[] {
	return allSlashCommands.map(buildCommand);
}
function buildCommands(which: BotCodeName): (SlashCommandBuilder | ContextMenuCommandBuilder)[] {
	return true ? buildUnifiedCommand(which) : buildIndividualCommands(which);
}

//#endregion

async function updateSlashCommands(bot: IBotCore): Promise<void> {
	const rest = new REST({version: '9'}).setToken(bot.token);
	try {
		console.log(`Started refreshing application (/) commands for: ${botCodeName}`);

		await rest.put(Routes.applicationCommands(bot.did), {
			body: buildCommands(bot.codeName)
		});

		console.log(`Successfully reloaded application (/) commands for: ${botCodeName}.`);
	} catch (error: any) {
		// console.info(Object.keys(error as any)); // [ 'rawError', 'code', 'status', 'method', 'url', 'requestBody' ]
		// console.error(`${error.code} (${error.rawError}): ${error.status}`); // undefined (undefined): undefined
		console.error(error);
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
			const built = buildCommands(botCodeName);
			writeFileSync(`../data/slash/${botCodeName}.json`, built, true, true);
			console.log(`Slash Commands built for ${botCodeName}: ${built.length} commands; ${characterCount} characters`);
		}catch(ex) {
			console.error(ex);
		}
	}
}
//#endregion

// node --experimental-modules --es-module-specifier-resolution=node slash.mjs