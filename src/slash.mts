import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { helpCommand } from "./sage-lib/sage/commands/help";
import { weatherCommand } from "./sage-lib/sage/commands/weather";
import type { IBotCore } from "./sage-lib/sage/model/Bot";
import utils from "./sage-utils";
import type { TNameDescription, TSlashCommand, TSlashCommandChoice, TSlashCommandOption } from "./types";

type TBot = "dev" | "beta" | "stable";

const args = process.argv.slice(2),
	botCodeName = ["dev","beta","stable"].find(s => args.includes(s)) as TBot ?? "dev",
	isUpdate = args.includes("update");

const botJson = utils.FsUtils.listFilesSync("./data/sage/bots")
	.map(file => utils.FsUtils.readJsonFileSync<IBotCore>(`./data/sage/bots/${file}`))
	.find(json => json?.codeName === botCodeName);
if (!botJson) {
	console.error(`Unable to find Bot: ${botCodeName}`);
}else {
	if (isUpdate) {
		updateSlashCommands(botJson!);
	}else {
		console.log(utils.JsonUtils.formattedStringify(buildCommands()));
	}
}

//#region command builders

/** Makes sure no matter how i give/set the choice it converts to what the API needs. */
function toChoice(choice: TSlashCommandChoice): [string, string] {
	if (Array.isArray(choice)) {
		return choice;
	}
	if (typeof(choice) === "string") {
		return [choice, choice];
	}
	return [choice.name, choice.value ?? choice.name];
}

/** shortcut for setting name/desc on all objects, also cleans the name for the API */
function setName<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SlashCommandStringOption>(builder: T, hasName: TNameDescription): T {
	return builder
		.setName(hasName.name.replace(/\W/g, "-"))
		.setDescription(hasName.description) as T;
}

/** shortcut for setting options all things that allow options */
function addOptions<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder>(builder: T, options?: TSlashCommandOption[]): T {
	options?.forEach(option =>
		builder.addStringOption(opt =>
			setName(opt, option).addChoices(option.choices?.map(toChoice) ?? [])
		)
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
	const cmd = new SlashCommandBuilder()
		.setName(raw.name)
		.setDescription(raw.description);
	raw.children?.forEach(child => {
		if (child.children?.length) {
			cmd.addSubcommandGroup(grp =>
				addSubcommands(grp.setName(child.name).setDescription(child.description), child.children)
			);
		}else {
			cmd.addSubcommand(sub =>
				addOptions(sub.setName(child.name).setDescription(child.description), child.options)
			);
		}
	});
	addOptions(cmd, raw.options);
	return cmd;
}

function buildCommands(): SlashCommandBuilder[] {
	const commands = [] as SlashCommandBuilder[];
	commands.push(buildCommand(helpCommand()));
	commands.push(buildCommand(weatherCommand()));
	return commands;
}

//#endregion

async function updateSlashCommands(bot: IBotCore): Promise<void> {
	const commands = buildCommands();

	const rest = new REST({version: '9'}).setToken(bot.token);

	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(Routes.applicationCommands(bot.did), {
			body: commands,
		});

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}

}

// node --experimental-modules --es-module-specifier-resolution=node slash.mjs