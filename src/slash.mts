import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import type { IBotCore } from "./sage-lib/sage/model/Bot";
import utils from "./sage-utils";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandStringOption } from "@discordjs/builders";

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

//#region /help

function helpCommands(): TCommand {
	return {
		name: "help",
		description: "Get basic Help for RPG Sage.",
		children: [
			{ name:"admin", description:"Admin Commands", options:[
				{ name:"subcategory", description:"Which subcategory?", choices:[
					{ name:"RPG Sage Admin", value:"admin", description:"Learn how to manage RPG Sage admins." },
					{ name:"Channel Management", value:"channel", description:"Learn how to manage RPG Sage channel settings." },
					{ name:"color", description:"Learn how to manage RPG Sage colors." },
					{ name:"companion", description:"Learn how to manage RPG Sage companions." },
					{ name:"emoji", description:"Learn how to manage RPG Sage emoji." },
					{ name:"game", description:"Learn how to manage RPG Sage games." },
					{ name:"gm", description:"Learn how to manage RPG Sage game masters." },
					{ name:"npc", description:"Learn how to manage RPG Sage non-player characters." },
					{ name:"pc", description:"Learn how to manage RPG Sage player characters." },
					{ name:"player", description:"Learn how to manage RPG Sage players." },
					{ name:"prefix", description:"Learn how to manage RPG Sage's command prefix" },
					{ name:"server", description:"Learn how to manage RPG Sage server wide settings." },
					{ name:"stats", description:"Learn how to manage RPG Sage character stats." },
					// { name:"superuser", description:"superuser" }
				] }
			] },
			{ name:"command", description:"Basic Commands" },
			{ name:"dialog", description:"Dialog Commands" },
			{ name:"dice", description:"Dice Commands", children:[
				{ name:"basic", description:"Basic Dice Options" },
				{ name:"pf2e", description:"Pathfinder 2e Specific Dice Options" }
			] },
			{ name:"lists", description:"How to list things ..." },
			{ name:"macro", description:"Macro Management" },
			{ name:"pfs", description:"PFS Tools" },
			{ name:"search", description:"PF2e Find/Search Tools" },
			{ name:"spells", description:"PF2e Spell Lists & Tools" },
			{ name:"wealth", description:"PF2e Wealth Lists & Tools", children:[
				{ name:"coin counter", description: "Learn how to count your coins." },
				{ name:"income earned", description: "Check how much income you should earn per encounter." },
				{ name:"starting wealth", description: "Check starting wealth per character level." },
			] }
		]
	};
}

//#endregion

//#region /weather

function weatherCommands(): TCommand {
	return {
		name: "weather",
		description: "Create random weather reports.",
		options: [
			{ name:"climate", description:"", choices:["Cold", "Temperate", "Tropical"] },
			{ name:"elevation", description:"", choices:["SeaLevel", "Lowland", "Highland"] },
			{ name:"season", description:"", choices:["Spring", "Summer", "Fall", "Winter", "Wet", "Dry"] },
		]
	};
}

//#endregion

//#region command builders

type TChoice = string | [string, string] | { name:string; value?:string; };
type TNameDescription = { name:string; description:string; };
type TOption = TNameDescription & { choices?:TChoice[]; }
type TCommand = TNameDescription & { children?:TCommand[]; options?:TOption[]; }

/** Makes sure no matter how i give/set the choice it converts to what the API needs. */
function toChoice(choice: TChoice): [string, string] {
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
function addOptions<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder>(builder: T, options?: TOption[]): T {
	options?.forEach(option =>
		builder.addStringOption(opt =>
			setName(opt, option).addChoices(option.choices?.map(toChoice) ?? [])
		)
	);
	return builder;
}

/** shortcut for setting subcommands where they are allowed */
function addSubcommands<T extends SlashCommandBuilder | SlashCommandSubcommandGroupBuilder>(builder: T, commands?: TCommand[]): T {
	commands?.forEach(command =>
		builder.addSubcommand(sub =>
			addOptions(setName(sub, command), command.options)
		)
	);
	return builder;
}

function buildCommand(raw: TCommand): SlashCommandBuilder {
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
	commands.push(buildCommand(helpCommands()));
	commands.push(buildCommand(weatherCommands()));
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