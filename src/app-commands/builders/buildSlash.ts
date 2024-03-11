import { SlashCommandBuilder } from "@discordjs/builders";
import type { SlashCommand } from "../types.js";
import { addOptions } from "./addOptions.js";
import { addSubcommands } from "./addSubCommands.js";
import { setName } from "./setName.js";

export function buildSlash(raw: SlashCommand): SlashCommandBuilder[] {
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
	return [cmd];
}
