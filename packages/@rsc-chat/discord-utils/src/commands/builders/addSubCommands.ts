import type { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import type { SlashCommand } from "../index.js";
import { addOptions } from "./addOptions.js";
import { setName } from "./setName.js";

/** shortcut for setting subcommands where they are allowed */
export function addSubcommands<T extends SlashCommandBuilder | SlashCommandSubcommandGroupBuilder>(builder: T, commands?: SlashCommand[]): T {
	commands?.forEach(command =>
		builder.addSubcommand(sub =>
			addOptions(setName(sub, command), command.options)
		)
	);
	return builder;
}