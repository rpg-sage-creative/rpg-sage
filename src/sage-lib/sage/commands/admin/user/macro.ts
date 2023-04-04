import { discordPromptYesNo } from "../../../../discord/prompts";
import type { Optional } from "../../../../../sage-utils";
import type { SageMessage } from "../../../model/SageMessage";
import type { TMacro } from "../../../model/User";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";
import { StringMatcher } from "../../../../../sage-utils/StringUtils";
import { isDefinedAndUnique } from "../../../../../sage-utils/ArrayUtils";

const UNCATEGORIZED = "Uncategorized";

function findMacro(sageMessage: SageMessage, name?: Optional<string>, category?: Optional<string>): TMacro | undefined {
	const nameMatcher = StringMatcher.from(name);
	if (nameMatcher.isBlank) {
		return undefined;
	}

	const categoryMatcher = StringMatcher.from(category);
	if (categoryMatcher.isBlank) {
		return sageMessage.actor.s.macros.find(macro => nameMatcher.matches(macro.name));
	}

	return sageMessage.actor.s.macros.find(macro => nameMatcher.matches(macro.name) && macro.category && categoryMatcher.matches(macro.category));
}

async function noMacrosFound(sageMessage: SageMessage): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>macro-list</b>`);
	renderableContent.append("<b>No Macros Found!</b>");
	return <any>sageMessage.send(renderableContent);
}

function toList(macros: TMacro[]): string {
	const listItems = macros.map(macro => `<li>${macro.name}</li>`);
	return `<ul>${listItems.join("")}</ul>`;
}

async function macroList(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("List Macros");
	if (denial) {
		return denial;
	}

	const macros = sageMessage.actor.s.macros;
	if (!macros.length) {
		return noMacrosFound(sageMessage);
	}

	const categoryInput = sageMessage.args.valueByKey(/cat(egory)?/i) ?? "";
	const cleanCategory = StringMatcher.clean(categoryInput);
	const filtered = macros.filter(macro => macro.category && cleanCategory === StringMatcher.clean(macro.category));
	if (filtered.length) {
		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>macro-list (filtered)</b>`);
		renderableContent.appendTitledSection(filtered[0].category!, toList(filtered));
		renderableContent.appendTitledSection(`<b>To view a macro, use:</b>`, `${sageMessage.prefix ?? ""}!!macro details name="${filtered[0].name}"`);
		return <any>sageMessage.send(renderableContent);

	} else {
		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>macro-list</b>`);
		const categories = macros.map(macro => macro.category).filter<string>(isDefinedAndUnique);
		categories.unshift(UNCATEGORIZED);
		categories.forEach(category => {
			const byCategory = macros.filter(macro => (macro.category ?? UNCATEGORIZED) === category);
			if (byCategory.length) {
				renderableContent.appendTitledSection(category, toList(byCategory));
			}
		});
		renderableContent.appendTitledSection(`<b>To view a macro, use:</b>`,
			`${sageMessage.prefix ?? ""}!!macro details name="${macros.first()!.name}"`,
			`${sageMessage.prefix ?? ""}!!macro list cat="${macros.first()!.name}"`
			);
		return <any>sageMessage.send(renderableContent);

	}

}

function _macroToPrompt(macro: TMacro, usage: boolean): string {
	const parts = [
		`\n> **Name:** ${macro.name}`,
		`\n> **Category:** ${macro.category ?? UNCATEGORIZED}`,
		`\n> **Dice:** \`\`${macro.dice}\`\``
	];
	if (usage) {
		parts.push(`\n\n*Usage:* \`[${macro.name.toLowerCase()}]\``);
	}
	return parts.join("");
}

function macroToPrompt(macro: TMacro, usage: boolean): string;
function macroToPrompt(category: Optional<string>, name: string, dice: string, usage: boolean): string;
function macroToPrompt(...args: (boolean | Optional<string> | TMacro)[]): string {
	const usage = <boolean>args.find(arg => typeof (arg) === "boolean");
	const macro = <TMacro>args.find(arg => typeof (arg) === "object")
		?? { category: <Optional<string>>args[0], name: <string>args[1], dice: <string>args[2] };
	return _macroToPrompt(macro, usage);
}

async function macroCreate(sageMessage: SageMessage, macro: TMacro): Promise<boolean> {
	const macroPrompt = macroToPrompt(macro, true);

	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Create macro?`);
	promptRenderable.append(macroPrompt);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable);
	if (bool === true) {
		return sageMessage.actor.s.macros.pushAndSave(macro);
	}
	return false;
}
async function macroUpdate(sageMessage: SageMessage, existing: TMacro, updated: TMacro): Promise<boolean> {
	const existingPrompt = macroToPrompt(existing, false);
	const updatedPrompt = macroToPrompt(updated, true);

	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Update macro?`);
	promptRenderable.append(`from:${existingPrompt}\nto:${updatedPrompt}`);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable);
	if (bool === true) {
		existing.category = updated.category ?? existing.category;
		existing.dice = updated.dice;
		return sageMessage.actor.s.save();
	}
	return false;
}
async function macroSet(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Set Macro");
	if (denial) {
		return denial;
	}

	const content = sageMessage.args.valueByKey(/dice|macro|value/i)
		?? sageMessage.args.unkeyedValues().join(" ");

	const diceMatch = content.match(/\[[^\]]+\]/ig);
	const macroCategory = sageMessage.args.valueByKey(/cat(egory)?/i) ?? undefined;
	const macroName = sageMessage.args.valueByKey("name");
	if (!macroName || !diceMatch) {
		return sageMessage.reactFailure("Must include a name and dice roll. Ex: sage!!macro set name=\"sword\" dice=\"[1d20 sword]\"");
	}

	let saved = false;
	const oldMacro = findMacro(sageMessage, macroName);
	const newMacro = { category:macroCategory, name:macroName, dice:diceMatch.join(" ") };
	if (oldMacro) {
		saved = await macroUpdate(sageMessage, oldMacro, newMacro);
	} else {
		saved = await macroCreate(sageMessage, newMacro);
	}
	return sageMessage.reactSuccessOrFailure(saved, "Macro Set.", "Unkonwn Error; Macro NOT Set!");
}

async function macroMove(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Move Macro");
	if (denial) {
		return denial;
	}

	const macroCategory = sageMessage.args.valueByKey(/cat(egory)?/i);
	const macroName = sageMessage.args.valueByKey("name");
	if (!macroName || !macroCategory) {
		return sageMessage.reactFailure("Must include a category and a name. Ex: sage!!amcro move name=\"short sword\" cat=\"swords\"");
	}

	let saved = false;
	const existing = findMacro(sageMessage, macroName);
	if (existing) {
		const existingPrompt = macroToPrompt(existing, false);
		const updatedPrompt = macroToPrompt(macroCategory, existing.name, existing.dice, false);

		const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Update macro?`);
		promptRenderable.append(`from:${existingPrompt}\nto:${updatedPrompt}`);

		const bool = await discordPromptYesNo(sageMessage, promptRenderable);
		if (bool === true) {
			existing.category = macroCategory ?? existing.category;
			saved = await sageMessage.actor.s.save();
		}
	}
	return sageMessage.reactSuccessOrFailure(saved, "Macro Moved.", "Unknown Error; Macro NOT Moved!");
}

async function macroDetails(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Show Macro Details");
	if (denial) {
		return denial;
	}

	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>Macro Details</b>`);

	const macroName = sageMessage.args.valueByKey("name");
	const existing = findMacro(sageMessage, macroName);
	if (existing) {
		renderableContent.append(macroToPrompt(existing, true));
	} else {
		renderableContent.append(`Macro not found! \`${macroName}\``);
	}
	return <any>sageMessage.send(renderableContent);
}

async function deleteCategory(sageMessage: SageMessage, category: string): Promise<void> {
	const cleanCategory = StringMatcher.clean(category);
	const byCategory = sageMessage.actor.s.macros.filter(macro => cleanCategory === StringMatcher.clean(macro.category ?? UNCATEGORIZED));
	if (!byCategory.length) {
		return <any>sageMessage.send(createAdminRenderableContent(sageMessage.getHasColors(), `Macro Category Not Found!`));
	}

	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `Delete Category ${byCategory.length} Macros?`);
	renderableContent.appendTitledSection(byCategory[0].category!, toList(byCategory));

	const yes = await discordPromptYesNo(sageMessage, renderableContent);
	if (yes === true) {
		const saved = await sageMessage.actor.s.macros.removeAndSave(...byCategory);
		return sageMessage.reactSuccessOrFailure(saved, "Macro Category Deleted.", "Unknown Error; Macro Category NOT Deleted!");
	}

	return Promise.resolve();
}
async function macroDeleteCategory(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Delete Macro Category");
	if (denial) {
		return denial;
	}

	const macroCategory = sageMessage.args.valueByKey(/cat(egory)?/i);
	if (macroCategory) {
		return deleteCategory(sageMessage, macroCategory);
	}
	return sageMessage.reactFailure("Macro Category not found!");
}

async function macroDeleteAll(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Delete All Macros");
	if (denial) {
		return denial;
	}

	const count = sageMessage.actor.s.macros.length;
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Delete All ${count} Macros?`);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable);
	if (yes === true) {
		const saved = await sageMessage.actor.s.macros.emptyAndSave();
		await sageMessage.reactSuccessOrFailure(saved, "All Macros Deleted", "Unknown Error; All Macros NOT Deleted!");
	}
	return Promise.resolve();
}

async function deleteMacro(sageMessage: SageMessage, macro: Optional<TMacro>): Promise<void> {
	if (!macro) {
		return sageMessage.reactFailure("Macro Not Found!");
	}

	const macroPrompt = macroToPrompt(macro, false);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Delete Macro?`);
	promptRenderable.append(macroPrompt);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable);
	if (yes === true) {
		const saved = await sageMessage.actor.s.macros.removeAndSave(macro);
		return sageMessage.reactSuccessOrFailure(saved, "Macro Deleted.", "Unknown Error; Macro NOT Deleted!");
	}
	return Promise.resolve();
}
async function macroDelete(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Delete Macro");
	if (denial) {
		return denial;
	}

	const macroCategory = sageMessage.args.valueByKey(/cat(egory)?/i);
	const macroName = sageMessage.args.valueByKey("name");
	if (macroCategory) {
		if (!macroName) {
			return deleteCategory(sageMessage, macroCategory);
		}
		const macro = findMacro(sageMessage, macroName, macroCategory);
		return deleteMacro(sageMessage, macro);
	} else if (macroName) {
		const macro = sageMessage.actor.s.macros.findByName(macroName);
		return deleteMacro(sageMessage, macro);
	}
	return sageMessage.reactFailure("Macro not found!");
}

export function register(): void {
	registerAdminCommand(macroList, "macro-list");

	registerAdminCommand(macroSet, "macro-set", "macro-add");

	registerAdminCommand(macroMove, "macro-move");

	registerAdminCommand(macroDetails, "macro-details");

	registerAdminCommand(macroDeleteAll, "macro-delete-all");
	registerAdminCommand(macroDelete, "macro-delete", "macro-unset", "macro-remove");
	registerAdminCommand(macroDeleteCategory, "macro-delete-category");


	registerAdminCommandHelp("Macro", "Delete", `macro delete all`);
	registerAdminCommandHelp("Macro", "Delete", `macro delete name="NAME"`);
	registerAdminCommandHelp("Macro", "Delete", `macro delete category="CATEGORY"`);

	registerAdminCommandHelp("Macro", "Details", `macro details name="NAME"`);

	registerAdminCommandHelp("Macro", "List", "macro list");
	registerAdminCommandHelp("Macro", "List", `macro list category="CATEGORY"`);

	registerAdminCommandHelp("Macro", "Move", `macro move name="NAME" category="CATEGORY"`);

	registerAdminCommandHelp("Macro", "Set", `macro set name="NAME"  [DICE]`);
	registerAdminCommandHelp("Macro", "Set", `macro set name="NAME"  dice="[DICE]"`);
	registerAdminCommandHelp("Macro", "Set", `macro set name="NAME" category="CATEGORY" [DICE]`);
	registerAdminCommandHelp("Macro", "Set", `macro set name="NAME" category="CATEGORY" dice="[DICE]"`);
}
