import { SlashCommandBuilder } from "@discordjs/builders";
import type { SlashCommand } from "../types.js";
import { addOptions } from "./addOptions.js";
import { addSubcommands } from "./addSubCommands.js";
import { setName } from "./setName.js";

function buildOne(raw: SlashCommand): SlashCommandBuilder {
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

export function buildSlash(all: SlashCommand[]): SlashCommandBuilder[] {
	const builders: SlashCommandBuilder[] = [];
	const games = new Map<string, SlashCommand[]>();
	all.forEach(cmd => {
		if (cmd.game) {
			if (!games.has(cmd.game)) {
				games.set(cmd.game, []);
			}
			games.get(cmd.game)?.push(cmd);
		}else {
			builders.push(buildOne(cmd));
		}
	});
	for (const [game, cmds] of games) {
		builders.push(buildOne({ name:game, children:cmds }));
	}
	return builders;
}
