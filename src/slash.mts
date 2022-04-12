import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { calCommands } from "./sage-lib/sage/commands/cal";
import { dmCommand } from "./sage-lib/sage/commands/default";
import { helpCommand } from "./sage-lib/sage/commands/help";
import { weatherCommand } from "./sage-lib/sage/commands/weather";
import type { IBotCore } from "./sage-lib/sage/model/Bot";
import utils from "./sage-utils";
import type { TNameDescription, TSlashCommand, TSlashCommandChoice, TSlashCommandOption } from "./types";

type TBot = "dev" | "beta" | "stable";

const args = process.argv.slice(2),
	botCodeName = ["dev","beta","stable"].find(s => args.includes(s)) as TBot ?? "dev",
	isUpdate = args.includes("update"),
	isWipe = args.includes("wipe");

let characterCount = 0;

const botJson = utils.FsUtils.listFilesSync("./data/sage/bots")
	.map(file => utils.FsUtils.readJsonFileSync<IBotCore>(`./data/sage/bots/${file}`))
	.find(json => json?.codeName === botCodeName);
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
type TBuilderOrSub = SlashCommandBuilder | SlashCommandSubcommandBuilder;
type TBuilderOrOption = SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SlashCommandStringOption;
function isRootOrSubBuilder<T extends TBuilderOrOption>(builder: T): boolean {
	return builder instanceof SlashCommandBuilder || builder instanceof SlashCommandSubcommandBuilder;
}
function setName<T extends TBuilderOrOption>(builder: T, hasName: TNameDescription): T {
	try {
		builder.setName(isRootOrSubBuilder(builder) ? hasName.name.toLowerCase() : hasName.name);
		builder.setDescription(hasName.description ?? builder.name);
		characterCount += builder.name.length + builder.description.length;
	}catch(ex) {
		console.error(`${hasName.name}: ${hasName.description}`);
	}
	return builder;
}

/** shortcut for setting options all things that allow options */
function addOptions<T extends TBuilderOrSub>(builder: T, options?: TSlashCommandOption[]): T {
	options?.forEach(option =>
		builder.addStringOption(opt => {
			setName(opt, option);
			option.choices?.forEach(choice => {
				const [name, value] = toChoice(choice);
				characterCount += name.length + value.length;
				opt.addChoice(name, value);
			});
			return opt;
		})
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

function collectCommands(): TSlashCommand[] {
	const commands = [] as TSlashCommand[];
	commands.push(helpCommand());
	commands.push(dmCommand());
	commands.push(...calCommands());
	commands.push(weatherCommand());
	return commands;
}
function buildUnifiedCommand(): SlashCommandBuilder[] {
	const command = { name:"Sage", description:"RPG Sage Commands", children:collectCommands() };
	return [buildCommand(command)];
}
function buildIndividualCommands(): SlashCommandBuilder[] {
	return collectCommands().map(buildCommand);
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

// node --experimental-modules --es-module-specifier-resolution=node slash.mjs