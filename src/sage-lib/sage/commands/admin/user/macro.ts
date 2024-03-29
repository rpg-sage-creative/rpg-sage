import { toUniqueDefined } from "@rsc-utils/array-utils";
import { error } from "@rsc-utils/console-utils";
import { getText } from "@rsc-utils/https-utils";
import { StringMatcher, unwrap, wrap } from "@rsc-utils/string-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { discordPromptYesNo } from "../../../../discord/prompts";
import type { SageMessage } from "../../../model/SageMessage";
import type { TMacro } from "../../../model/User";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { isGoogleSheetTsvUrl } from "../../dice/isGoogleSheetTsvUrl";
import { isMath } from "../../dice/isMath";
import { isRandomItem } from "../../dice/isRandomItem";
import { isTable } from "../../dice/isTable";
import { registerAdminCommandHelp } from "../../help";

const UNCATEGORIZED = "Uncategorized";

function findMacro(sageMessage: SageMessage, name?: string, category?: string): TMacro | undefined {
	const nameMatcher = StringMatcher.from(name);
	if (!nameMatcher.isNonNil) {
		return undefined;
	}

	const categoryMatcher = StringMatcher.from(category);
	if (categoryMatcher.isNonNil) {
		return sageMessage.sageUser.macros.find(macro => nameMatcher.matches(macro.name) && macro.category && categoryMatcher.matches(macro.category));
	}

	return sageMessage.sageUser.macros.find(macro => nameMatcher.matches(macro.name));
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

	const categoryInput = sageMessage.args.removeKeyValuePair(/cat(egory)?/i)?.value ?? sageMessage.args[0] ?? "";
	const cleanCategory = StringMatcher.clean(categoryInput);
	const filtered = macros.filter(macro => macro.category && cleanCategory === StringMatcher.clean(macro.category));
	if (filtered.length) {
		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>macro-list (filtered)</b>`);
		renderableContent.appendTitledSection(filtered[0].category!, toList(filtered));
		renderableContent.appendTitledSection(`<b>To view a macro, use:</b>`, `${sageMessage.prefix ?? ""}!!macro details name="${filtered[0].name}"`);
		return <any>sageMessage.send(renderableContent);

	} else {
		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>macro-list</b>`);
		const categories = macros.map(macro => macro.category).filter<string>(toUniqueDefined);
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

function _macroToPrompt(macro: TMacro, usage: boolean, warning: boolean): string {
	let parts: string[];
	if (isGoogleSheetTsvUrl(macro.dice)) {
		parts = [
			`\n> **Name:** ${macro.name}`,
			`\n> **Category:** ${macro.category ?? UNCATEGORIZED}`,
			`\n> **Table Url:** \`${unwrap(macro.dice, "[]")}\``
		];
	}else if (isTable(macro.dice)) {
		parts = [
			`\n> **Name:** ${macro.name}`,
			`\n> **Category:** ${macro.category ?? UNCATEGORIZED}`,
			`\n> **Table:** \`\`\`${unwrap(macro.dice, "[]").replace(/\n/g, "\n> ")}\`\`\``
		];
	}else if (isRandomItem(macro.dice)) {
		parts = [
			`\n> **Name:** ${macro.name}`,
			`\n> **Category:** ${macro.category ?? UNCATEGORIZED}`,
			`\n> **Items:** \n${unwrap(macro.dice, "[]").split(",").map(item => `> - ${item}`).join("\n")}`
		];
	}else {
		const _isMath = isMath(macro.dice);
		const label = _isMath ? "Math" : "Dice";
		parts = [
			`\n> **Name:** ${macro.name}`,
			`\n> **Category:** ${macro.category ?? UNCATEGORIZED}`,
			`\n> **${label}:** \`\`${macro.dice.replace(/\n/g, "\n> ")}\`\``
		];
	}
	if (usage) {
		parts.push(`\n\n*Usage:* \`[${macro.name.toLowerCase()}]\``);
	}
	if (warning) {
		parts.push(`\n***Warning:** This overrides Sage dialog emoji: [${macro.name.toLowerCase()}]*`);
	}
	return parts.join("");
}

function macroToPrompt(macro: TMacro, usage: boolean, warning: boolean): string;
function macroToPrompt(category: Optional<string>, name: string, dice: string, usage: boolean, warning: boolean): string;
function macroToPrompt(...args: (boolean | Optional<string> | TMacro)[]): string {
	const warning = args.pop() as boolean;
	const usage = args.pop() as boolean;
	const macro = <TMacro>args.find(arg => typeof (arg) === "object")
		?? { category: <Optional<string>>args[0], name: <string>args[1], dice: <string>args[2] };
	return _macroToPrompt(macro, usage, warning);
}
function checkForOverride(sageMessage: SageMessage, usage: string): boolean {
	return sageMessage.caches.emojify(usage) !== usage;
}
async function macroCreate(sageMessage: SageMessage, macro: TMacro): Promise<boolean> {
	const warning = checkForOverride(sageMessage, `[${macro.name}]`);
	const macroPrompt = macroToPrompt(macro, true, warning);

	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Create macro?`);
	promptRenderable.append(macroPrompt);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable);
	if (bool === true) {
		return sageMessage.sageUser.macros.pushAndSave(macro);
	}
	return false;
}
async function macroUpdate(sageMessage: SageMessage, existing: TMacro, updated: TMacro): Promise<boolean> {
	const warning = checkForOverride(sageMessage, `[${updated.name}]`);
	const existingPrompt = macroToPrompt(existing, false, false);
	const updatedPrompt = macroToPrompt(updated, true, warning);

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

	const namePair = sageMessage.args.removeKeyValuePair("name");
	const categoryPair = sageMessage.args.removeKeyValuePair(/cat(egory)?/i);
	const contentPair = sageMessage.args.removeKeyValuePair(/dice|macro|value|table/i);
	if (contentPair?.key === "table") {
		let tableValue = unwrap(contentPair.value ?? "", "[]");
		if (isGoogleSheetTsvUrl(tableValue)) {
			tableValue = await getText(tableValue).catch(error) ?? "";
		}
		if (!isTable(tableValue)) {
			return sageMessage.reactFailure("Invalid Table Data");
		}
		contentPair.value = wrap(tableValue, "[]");
	}

	const content = sageMessage.args.join(" ");
	const diceMatch = (contentPair?.value ?? content).match(/\[[^\]]+\]/ig);
	if (!diceMatch) {
		return sageMessage.reactFailure();
	}

	const macroCategory = categoryPair?.value ?? undefined;
	const macroDice = diceMatch.join("");
	const macroName = namePair?.value ?? content.replace(macroDice, "").trim();
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

	const categoryPair = sageMessage.args.removeKeyValuePair(/cat(egory)?/i);
	const macroName = sageMessage.args.removeAndReturnName(true);
	if (!macroName || !categoryPair) {
		return sageMessage.reactFailure();
	}

	let saved = false;
	const existing = findMacro(sageMessage, macroName);
	if (existing) {
		const existingPrompt = macroToPrompt(existing, false, false);
		const updatedPrompt = macroToPrompt(categoryPair.value, existing.name, existing.dice, false, false);

		const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Update macro?`);
		promptRenderable.append(`from:${existingPrompt}\nto:${updatedPrompt}`);

		const bool = await discordPromptYesNo(sageMessage, promptRenderable);
		if (bool === true) {
			existing.category = categoryPair.value ?? existing.category;
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

	const macroName = sageMessage.args.removeAndReturnName(true);
	const existing = findMacro(sageMessage, macroName);
	if (existing) {
		const warning = checkForOverride(sageMessage, `[${existing.name}]`);
		renderableContent.append(macroToPrompt(existing, true, warning));
	} else {
		renderableContent.append(`Macro not found! \`${macroName}\``);
	}
	return <any>sageMessage.send(renderableContent);
}

async function deleteCategory(sageMessage: SageMessage, category: string): Promise<void> {
	const cleanCategory = StringMatcher.clean(category);
	const byCategory = sageMessage.sageUser.macros.filter(macro => cleanCategory === StringMatcher.clean(macro.category ?? UNCATEGORIZED));
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

	const category = sageMessage.args.removeKeyValuePair(/cat(egory)?/i)?.value ?? sageMessage.args[0];
	if (category) {
		return deleteCategory(sageMessage, category);
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

	const macroPrompt = macroToPrompt(macro, false, false);
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

	const macroCategory = sageMessage.args.removeKeyValuePair(/cat(egory)?/i)?.value;
	const macroName = sageMessage.args.removeAndReturnName(true);
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

export function registerMacro(): void {
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
