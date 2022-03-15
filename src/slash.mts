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
		try {
			const built = buildCommands();
			// console.log(built);
			console.log(utils.JsonUtils.formattedStringify(built));
		}catch(ex) {
			console.error(ex);
		}
	}
}

function clean(value: string): string {
	return value?.replace(/\W/g, "-") ?? "WTF";
}

//#region command builders

/** Makes sure no matter how i give/set the choice it converts to what the API needs. */
function toChoice(choice: TSlashCommandChoice): [string, string] {
	if (Array.isArray(choice)) {
		return [clean(choice[0]), clean(choice[1])];
	}
	if (typeof(choice) === "string") {
		return [clean(choice), clean(choice)];
	}
	return [clean(choice.name), clean(choice.value ?? choice.name)];
}

/** shortcut for setting name/desc on all objects, also cleans the name for the API */
function setName<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SlashCommandStringOption>(builder: T, hasName: TNameDescription): T {
	try {
		builder.setName(clean(hasName.name));
		builder.setDescription(clean(hasName.description) ?? builder.name);
	}catch(ex) {
		console.error(hasName, ex);
	}
	return builder;
}

/** shortcut for setting options all things that allow options */
function addOptions<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder>(builder: T, options?: TSlashCommandOption[]): T {
	options?.forEach(option =>
		builder.addStringOption(opt => {
			setName(opt, option);
			option.choices?.forEach(choice => {
				opt.addChoice(...toChoice(choice));
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

function buildCommands(): SlashCommandBuilder[] {
	const children = [] as TSlashCommand[];
	if (false) children.push(helpCommand());
	children.push(weatherCommand());
	const command = { name:"Sage", description:"RPG Sage's Commands", children:children };
	return [buildCommand(command)];
	// const commands = [] as SlashCommandBuilder[];
	// commands.push(buildCommand(helpCommand()));
	// commands.push(buildCommand(weatherCommand()));
	// return commands;
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