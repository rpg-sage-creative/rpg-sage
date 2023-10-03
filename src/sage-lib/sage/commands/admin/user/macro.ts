import { discordPromptYesNo } from "../../../../discord/prompts";
import utils, { Optional } from "../../../../../sage-utils";
import type SageMessage from "../../../model/SageMessage";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";
import NamedCollection from "../../../model/NamedCollection";
import { IEmoji } from "../../../model/HasEmojiCore";
import { HasMacros, TMacro } from "../../../model/types";

const UNCATEGORIZED = "Uncategorized";

/** Checks for SuperUser and Bot.did */
function isSageBotCategory(sageMessage: SageMessage, category?: string): boolean {
	return sageMessage.isSuperUser && category === sageMessage.bot.did;
}

/** Checks for AdminServer and Server.did */
function isSageServerCategory(sageMessage: SageMessage, category?: string): boolean {
	return sageMessage.canAdminServer && category === sageMessage.server?.did;
}

/** Checks for AdminGame and Game.id */
function isSageGameCategory(sageMessage: SageMessage, category?: string): boolean {
	return sageMessage.canAdminGame && category === sageMessage.game?.id;
}

/** Gets the appropriate NamedCollection<TMacro> by checking category and perms. */
function getHasMacros(sageMessage: SageMessage, category?: string): HasMacros {
	return isSageBotCategory(sageMessage, category) ? sageMessage.bot
		: isSageServerCategory(sageMessage, category) ? sageMessage.server
		: isSageGameCategory(sageMessage, category) ? sageMessage.game!
		: sageMessage.sageUser;
}

/** Gets the appropriate level of Macro for the prompts' titles. */
function getMacroCategoryLabel(sageMessage: SageMessage, category?: string): string {
	return isSageBotCategory(sageMessage, category) ? "Global"
		: isSageServerCategory(sageMessage, category) ? "Server"
		: isSageGameCategory(sageMessage, category) ? "Game"
		: "User";
}

function getMacros(sageMessage: SageMessage, category?: string): NamedCollection<TMacro> {
	return getHasMacros(sageMessage, category).macros;
}

function findMacro(sageMessage: SageMessage, name?: string, category?: string): TMacro | undefined {
	const nameMatcher = utils.StringUtils.StringMatcher.from(name);
	if (nameMatcher.isBlank) {
		return undefined;
	}

	const macros = getMacros(sageMessage, category);

	const categoryMatcher = utils.StringUtils.StringMatcher.from(category);
	if (categoryMatcher.isBlank) {
		return macros.find(macro => nameMatcher.matches(macro.name));
	}

	return macros.find(macro => nameMatcher.matches(macro.name) && macro.category && categoryMatcher.matches(macro.category));
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

	const categoryInput = sageMessage.args.removeKeyValuePair(/cat(egory)?/i)?.value ?? sageMessage.args[0] ?? "";
	const cleanCategory = utils.StringUtils.StringMatcher.clean(categoryInput);

	const macros = getMacros(sageMessage, cleanCategory);
	if (!macros.length) {
		return noMacrosFound(sageMessage);
	}

	const filtered = macros.filter(macro => macro.category && cleanCategory === utils.StringUtils.StringMatcher.clean(macro.category));
	if (filtered.length) {
		const cat = filtered[0].category!;
		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>macro-list (category: "${cat}")</b>`);
		renderableContent.appendTitledSection(cat, toList(filtered));
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

function _macroToPrompt(macro: TMacro, usage: boolean, emoji: Optional<IEmoji>, globalMacro: Optional<TMacro>): string {
	const parts = [
		`\n> **Name:** ${macro.name}`,
		`\n> **Category:** ${macro.category ?? UNCATEGORIZED}`,
		`\n> **Dice:** \`\`${macro.dice}\`\``
	];
	if (usage) {
		parts.push(`\n\n*Usage:* \`[${macro.name.toLowerCase()}]\``);
	}
	if (emoji) {
		const lower = macro.name.toLowerCase();
		const match = emoji.matches.find(match => match.toLowerCase() === lower);
		parts.push(`\n***Warning:** This overrides Sage dialog emoji: \`[${match}]\` > [${match}]*`);
	}
	if (globalMacro) {
		parts.push(`\n***Warning:** This overrides Sage Global macro: \`[${globalMacro.name}]\`*`);
	}
	return parts.join("");
}

function macroToPrompt(macro: TMacro, usage: boolean, emoji: Optional<IEmoji>, globalMacro: Optional<MaskedMacro>): string;
function macroToPrompt(category: Optional<string>, name: string, dice: string, usage: boolean, emoji: Optional<IEmoji>, globalMacro: Optional<MaskedMacro>): string;
function macroToPrompt(...args: (boolean | Optional<string | TMacro | IEmoji>)[]): string {
	const maskedMacro = args.pop() as Optional<MaskedMacro>;
	const emoji = args.pop() as Optional<IEmoji>;
	const usage = args.pop() as boolean;
	const macro = args.find(arg => typeof (arg) === "object") as TMacro
		?? { category: args[0], name: args[1], dice: args[2] };
	return _macroToPrompt(macro, usage, emoji, maskedMacro);
}

type MaskedMacro = TMacro & {
	ownerType: "Global" | "Server" | "Game";
	ownerName: string;
};

/** Finds a macro that is being hidden by this user macro. */
function findMaskedMacro(sageMessage: SageMessage, name: string): MaskedMacro | undefined {
	const game = sageMessage.game;
	const gameMacro = game?.macros.findByName(name);
	if (gameMacro) {
		return { ownerType:"Game", ownerName:game!.name, ...gameMacro };
	}

	const server = sageMessage.server;
	const serverMacro = server.macros.findByName(name);
	if (serverMacro) {
		return { ownerType:"Server", ownerName:server!.name, ...serverMacro };
	}

	const bot = sageMessage.bot;
	const botMacro = bot.macros.findByName(name);
	if (botMacro) {
		return { ownerType:"Global", ownerName:bot.codeName, ...botMacro };
	}

	return undefined;
}

async function macroCreate(sageMessage: SageMessage, macro: TMacro): Promise<boolean> {
	const emoji = sageMessage.findEmojiByMatch(macro.name);
	const maskedMacro = findMaskedMacro(sageMessage, macro.name);
	const macroPrompt = macroToPrompt(macro, true, emoji, maskedMacro);

	const hasColors = sageMessage.getHasColors();
	const categoryLabel = getMacroCategoryLabel(sageMessage, macro.category);
	const title = `Create ${categoryLabel} Macro?`;
	const promptRenderable = createAdminRenderableContent(hasColors, title);
	promptRenderable.append(macroPrompt);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable);
	if (bool === true) {
		const macros = getMacros(sageMessage, macro.category);
		return macros.pushAndSave(macro);
	}
	return false;
}

async function macroUpdate(sageMessage: SageMessage, existing: TMacro, updated: TMacro): Promise<boolean> {
	const emoji = sageMessage.findEmojiByMatch(updated.name);
	const maskedMacro = findMaskedMacro(sageMessage, updated.name);
	const existingPrompt = macroToPrompt(existing, false, undefined, undefined);
	const updatedPrompt = macroToPrompt(updated, true, emoji, maskedMacro);

	const hasColors = sageMessage.getHasColors();
	const categoryLabel = getMacroCategoryLabel(sageMessage, updated.category);
	const title = `Update ${categoryLabel} Macro?`;
	const promptRenderable = createAdminRenderableContent(hasColors, title);
	promptRenderable.append(`from:${existingPrompt}\nto:${updatedPrompt}`);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable);
	if (bool === true) {
		existing.category = updated.category ?? existing.category;
		existing.dice = updated.dice;
		return getHasMacros(sageMessage, existing.category).save();
	}
	return false;
}

async function macroSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
	}

	const namePair = sageMessage.args.removeKeyValuePair("name");
	const categoryPair = sageMessage.args.removeKeyValuePair(/cat(egory)?/i);
	const contentPair = sageMessage.args.removeKeyValuePair(/dice|macro|value/i);

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
		const existingPrompt = macroToPrompt(existing, false, undefined, undefined);
		const updatedPrompt = macroToPrompt(categoryPair.value, existing.name, existing.dice, false, undefined, undefined);

		// const hasColors = sageMessage.getHasColors();
		// const categoryLabel = getMacroCategoryLabel(sageMessage, updated.category);
		// const title = `Update ${categoryLabel} Macro?`
		// const promptRenderable = createAdminRenderableContent(hasColors, title);
		const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Update User Macro?`);
		promptRenderable.append(`from:${existingPrompt}\nto:${updatedPrompt}`);

		const bool = await discordPromptYesNo(sageMessage, promptRenderable);
		if (bool === true) {
			existing.category = categoryPair.value ?? existing.category;
			saved = await getHasMacros(sageMessage, existing.category).save();
		}
	}
	return sageMessage.reactSuccessOrFailure(saved);
}

async function macroDetails(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
	}

	const macroName = sageMessage.args.removeAndReturnName(true);
	const existing = findMacro(sageMessage, macroName);

	const hasColors = sageMessage.getHasColors();
	const categoryLabel = getMacroCategoryLabel(sageMessage, existing?.category);
	const title = `<b>${categoryLabel} Macro Details</b>`;
	const renderableContent = createAdminRenderableContent(hasColors, title);

	if (existing) {
		const emoji = sageMessage.findEmojiByMatch(existing.name);
		const maskedMacro = findMaskedMacro(sageMessage, existing.name);
		renderableContent.append(macroToPrompt(existing, true, emoji, maskedMacro));
	} else {
		renderableContent.append(`Macro not found! \`${macroName}\``);
	}
	return <any>sageMessage.send(renderableContent);
}

async function deleteCategory(sageMessage: SageMessage, category: string): Promise<void> {
	const cleanCategory = utils.StringUtils.StringMatcher.clean(category);
	if (cleanCategory === "sage") {
		return sageMessage.reactFailure("Cannot Delete Sage Macro Category");
	}

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

	const macroPrompt = macroToPrompt(macro, false, undefined, undefined);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Delete Macro?`);
	promptRenderable.append(macroPrompt);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable);
	if (yes === true) {
		const macros = getMacros(sageMessage, macro.category);
		const saved = await macros.removeAndSave(macro);
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
		const macro = findMacro(sageMessage, macroName);
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
