import { quote, unwrap } from "@rsc-utils/string-utils";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { Macro } from "./HasMacros.js";
import { checkForEmojiOverride } from "./checkForEmojiOverride.js";

type PromptOptions = {
	share?: boolean;
	usage?: boolean;
};

export function macroToPrompt(sageCommand: SageCommand, macro: Macro, opts?: PromptOptions): string {
	const localize = sageCommand.getLocalizer();

	const parts = [
		`\n> **${localize("NAME")}:** ${macro.name}`,
		`\n> **${localize("CATEGORY")}:** ${macro.category ?? localize("UNCATEGORIZED")}`
	];

	const unwrapped = unwrap(macro.dice, "[]");

	if (macro.type === "tableUrl") {
		parts.push(`\n> **${localize("TABLE_URL")}:** \`${unwrapped}\``);

	}else if (macro.type === "table") {
		parts.push(`\n> **${localize("TABLE")}:** \`\`\`${unwrapped.replace(/\n/g, "\n> ")}\`\`\``);

	}else if (macro.type == "items") {
		parts.push(`\n> **${localize("ITEMS")}:** \n${unwrapped.split(",").map(item => `> - ${item}`).join("\n")}`);

	}else if (macro.type === "math") {
		parts.push(`\n> **${localize("MATH")}:** \`\`${macro.dice.replace(/\n/g, "\n> ")}\`\``);

	}else {
		parts.push(`\n> **${localize("DICE")}:** \`\`${macro.dice.replace(/\n/g, "\n> ")}\`\``);
	}

	if (opts?.usage) {
		parts.push(`\n\n*${localize("USAGE")}:* \`[${macro.name.toLowerCase()}]\``);
		const warning = checkForEmojiOverride(sageCommand, `[${macro.name}]`);
		if (warning) {
			parts.push(`\n***${localize("WARNING")}** ${localize("OVERRIDES_SAGE_DIALOG_EMOJI")} [${macro.name.toLowerCase()}]*`);
		}
	}

	if (opts?.share) {
		const nameArg = `name="${macro.name}"`;
		const catArg = macro.category ? `cat="${macro.category}"` : ``;
		const diceArg = `dice=${quote(macro.dice)}`;
		parts.push(`\n\n*${localize("SHARE")}*:\`\`\`sage! macro set ${nameArg} ${catArg} ${diceArg}\`\`\``);
	}

	return parts.join("");
}