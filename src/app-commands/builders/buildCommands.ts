import type { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { getBotCodeName } from "@rsc-utils/env-utils";
import { registerCommands } from "../commands/registerCommands.js";
import { buildContext } from "./buildContext.js";
import { buildSlash } from "./buildSlash.js";
import { buildUser } from "./buildUser.js";

type BuilderType = SlashCommandBuilder | ContextMenuCommandBuilder;

async function buildUnifiedCommand(): Promise<BuilderType[]> {
	const which = getBotCodeName();
	const dashWhich = `-${which}`;
	const parenWhich = ` (${which})`;
	const commands = await registerCommands();
	const slashCommand = {
		name: `Sage${which === "stable" ? "" : dashWhich}`,
		description: `RPG Sage${which === "stable" ? "" : parenWhich} Commands`,
		children: commands.slash
	};

	const builders: BuilderType[] = [];
	builders.push(...buildSlash(slashCommand));
	builders.push(...buildContext());
	builders.push(...buildUser());
	return builders;
}

async function buildIndividualCommands(): Promise<BuilderType[]> {
	const commands = await registerCommands();
	const builders: BuilderType[] = [];
	builders.push(...commands.slash.map(buildSlash).flat());
	builders.push(...buildContext());
	builders.push(...buildUser());
	return builders;
}

export async function buildCommands(): Promise<BuilderType[]> {
	const unified = process.argv.includes("unified");
	return unified
		? buildUnifiedCommand()
		: buildIndividualCommands();
}