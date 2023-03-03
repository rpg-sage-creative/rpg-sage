import { discordPromptYesNo } from "../../../../discord/prompts";
import utils, { Optional } from "../../../../../sage-utils";
import type SageMessage from "../../../model/SageMessage";
import type { TMacro } from "../../../model/User";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

const UNCATEGORIZED = "Uncategorized";

function findMacro(sageMessage: SageMessage, name?: Optional<string>, category?: Optional<string>): TMacro | undefined {
	const nameMatcher = utils.StringUtils.StringMatcher.from(name);
	if (nameMatcher.isBlank) {
		return undefined;
	}

	const categoryMatcher = utils.StringUtils.StringMatcher.from(category);
	if (categoryMatcher.isBlank) {
		return sageMessage.sageUser.macros.find(macro => nameMatcher.matches(macro.name));
	}

	return sageMessage.sageUser.macros.find(macro => nameMatcher.matches(macro.name) && macro.category && categoryMatcher.matches(macro.category));
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
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
	}

	const macros = sageMessage.sageUser.macros;
	if (!macros.length) {
		return noMacrosFound(sageMessage);
	}

	const categoryInput = sageMessage.args.valueByKey(/cat(egory)?/i) ?? "";
	const cleanCategory = utils.StringUtils.StringMatcher.clean(categoryInput);
	const filtered = macros.filter(macro => macro.category && cleanCategory === utils.StringUtils.StringMatcher.clean(macro.category));
	if (filtered.length) {
		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>macro-list (filtered)</b>`);
		renderableContent.appendTitledSection(filtered[0].category!, toList(filtered));
		renderableContent.appendTitledSection(`<b>To view a macro, use:</b>`, `${sageMessage.prefix ?? ""}!!macro details name="${filtered[0].name}"`);
		return <any>sageMessage.send(renderableContent);

	} else {
		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>macro-list</b>`);
		const categories = macros.map(macro => macro.category).filter<string>(utils.ArrayUtils.Filters.existsAndUnique);
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
		return sageMessage.sageUser.macros.pushAndSave(macro);
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
		return sageMessage.sageUser.save();
	}
	return false;
}
async function macroSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
	}

	const content = sageMessage.args.valueByKey(/dice|macro|value/i)
		?? sageMessage.args.unkeyedValues().join(" ");

	const diceMatch = content.match(/\[[^\]]+\]/ig);
	if (!diceMatch) {
		return sageMessage.reactFailure();
	}

	const macroCategory = sageMessage.args.valueByKey(/cat(egory)?/i) ?? undefined;
	const macroDice = diceMatch.join("");
	const macroName = sageMessage.args.valueByKey("name") ?? content.replace(macroDice, "").trim();
	if (!macroName) {
		return sageMessage.reactFailure();
	}

	let saved = false;
	const oldMacro = findMacro(sageMessage, macroName);
	const newMacro = { category:macroCategory, name:macroName, dice:macroDice };
	if (oldMacro) {
		saved = await macroUpdate(sageMessage, oldMacro, newMacro);
	} else {
		saved = await macroCreate(sageMessage, newMacro);
	}
	return sageMessage.reactSuccessOrFailure(saved);
}

async function macroMove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
	}

	const macroCategory = sageMessage.args.valueByKey(/cat(egory)?/i);
	const macroName = sageMessage.args.valueByKey("name");
	if (!macroName || !macroCategory) {
		return sageMessage.reactFailure();
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
			saved = await sageMessage.sageUser.save();
		}
	}
	return sageMessage.reactSuccessOrFailure(saved);
}

async function macroDetails(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
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
	const cleanCategory = utils.StringUtils.StringMatcher.clean(category);
	const byCategory = sageMessage.sageUser.macros.filter(macro => cleanCategory === utils.StringUtils.StringMatcher.clean(macro.category ?? UNCATEGORIZED));
	if (!byCategory.length) {
		return <any>sageMessage.send(createAdminRenderableContent(sageMessage.getHasColors(), `Macro Category Not Found!`));
	}

	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `Delete Category ${byCategory.length} Macros?`);
	renderableContent.appendTitledSection(byCategory[0].category!, toList(byCategory));

	const yes = await discordPromptYesNo(sageMessage, renderableContent);
	if (yes === true) {
		const saved = await sageMessage.sageUser.macros.removeAndSave(...byCategory);
		return sageMessage.reactSuccessOrFailure(saved);
	}

	return Promise.resolve();
}
async function macroDeleteCategory(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
	}

	const macroCategory = sageMessage.args.valueByKey(/cat(egory)?/i);
	if (macroCategory) {
		return deleteCategory(sageMessage, macroCategory);
	}
	return sageMessage.reactFailure();
}

async function macroDeleteAll(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
	}

	const count = sageMessage.sageUser.macros.length;
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Delete All ${count} Macros?`);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable);
	if (yes === true) {
		const saved = await sageMessage.sageUser.macros.emptyAndSave();
		return sageMessage.reactSuccessOrFailure(saved);
	}
	return Promise.resolve();
}

async function deleteMacro(sageMessage: SageMessage, macro: Optional<TMacro>): Promise<void> {
	if (!macro) {
		return sageMessage.reactFailure();
	}

	const macroPrompt = macroToPrompt(macro, false);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Delete Macro?`);
	promptRenderable.append(macroPrompt);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable);
	if (yes === true) {
		const saved = await sageMessage.sageUser.macros.removeAndSave(macro);
		return sageMessage.reactSuccessOrFailure(saved);
	}
	return Promise.resolve();
}
async function macroDelete(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
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
		const macro = sageMessage.sageUser.macros.findByName(macroName);
		return deleteMacro(sageMessage, macro);
	}
	return sageMessage.reactFailure();
}

export default function register(): void {
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
