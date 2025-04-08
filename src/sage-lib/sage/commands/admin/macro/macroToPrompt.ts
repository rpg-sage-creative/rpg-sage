import { quote, unwrap } from "@rsc-utils/string-utils";
import type { Macro } from "../../../model/Macro.js";
import { MacroOwner } from "../../../model/MacroOwner.js";
import type { SageCommand } from "../../../model/SageCommand.js";

type PromptOptions = {
	share?: boolean;
	usage?: boolean;
};

export async function macroToPrompt(sageCommand: SageCommand, macro: Macro, opts?: PromptOptions): Promise<string> {
	const localize = sageCommand.getLocalizer();

	const category = macro.isUncategorized ? `*${localize("UNCATEGORIZED")}*` : macro.category;
	const parts = [
		`\n> **${localize("NAME")}:** ${macro.name}`,
		`\n> **${localize("CATEGORY")}:** ${category}`
	];

	if (macro.isTableUrl()) {
		parts.push(`\n> **${localize("TABLE_URL")}:** \`${unwrap(macro.dice, "[]")}\``);

	}else if (macro.isTable()) {
		parts.push(`\n> **${localize("TABLE")}:** \`\`\`${unwrap(macro.dice, "[]").replace(/\n/g, "\n> ")}\`\`\``);

	}else if (macro.isItems()) {
		parts.push(`\n> **${localize("ITEMS")}:** \n${unwrap(macro.dice, "[]").split(",").map(item => `> - ${item}`).join("\n")}`);

	}else if (macro.isMath()) {
		parts.push(`\n> **${localize("MATH")}:** \`\`${macro.dice.replace(/\n/g, "\n> ")}\`\``);

	}else if (macro.isDice()) {
		parts.push(`\n> **${localize("DICE")}:** \`\`${macro.dice.replace(/\n/g, "\n> ")}\`\``);

	}else if (macro.isDialog()) {
		parts.push(`\n> **${localize("DIALOG")}:** \`\`${macro.dialog.replace(/\n/g, "\n> ")}\`\``);
	}

	const owner = await MacroOwner.findOwner(sageCommand, macro);
	if (owner) {
		parts.push(`\n> **${localize(owner.typeKey)}:** ${owner.name}`);
	}else {
		// parts.push(`\n> **${localize("USER")}:** @Me`);
	}

	if (opts?.usage) {
		if (macro.isDialog()) {
			const usage = `${macro.name.toLowerCase()}::type your dialog here!`;
			parts.push(`\n\n*${localize("USAGE")}:* \`${usage}\``);

		}else {
			const usage = `[${macro.name.toLowerCase()}]`;
			parts.push(`\n\n*${localize("USAGE")}:* \`${usage}\``);
			const warning = sageCommand.sageCache.emojify(usage) !== usage;
			if (warning) {
				parts.push(`\n***${localize("WARNING")}** ${localize("OVERRIDES_SAGE_DIALOG_EMOJI")} ${usage}*`);
			}
		}
	}

	if (opts?.share) {
		const nameArg = `name="${macro.name}"`;
		const catArg = macro.isUncategorized ? `` : ` category="${macro.category}"`;
		const contentArg = ` ${macro.type}=${quote(macro.dialog ?? macro.dice ?? "")}`;
		parts.push(`\n\n*${localize("SHARE")}*:\`\`\`sage! macro set ${nameArg}${catArg}${contentArg}\`\`\``);
	}

	return parts.join("");
}