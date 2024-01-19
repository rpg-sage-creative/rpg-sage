import { toUniqueDefined } from "@rsc-utils/array-utils";
import { getSuperUserId } from "@rsc-utils/env-utils";
import { Snowflake } from "@rsc-utils/snowflake-utils";
import { isDefined, type Optional } from "@rsc-utils/type-utils";
import { RenderableContent } from "../../../sage-utils/utils/RenderUtils";
import type { TChannel, TCommandAndArgs } from "../../discord";
import { ArgsManager } from "../../discord/ArgsManager";
import { registerInteractionListener, registerMessageListener } from "../../discord/handlers";
import { send } from "../../discord/messages";
import type { SageCache } from "../model/SageCache";
import type { SageInteraction } from "../model/SageInteraction";
import type { SageMessage } from "../model/SageMessage";
import { createCommandRenderableContent } from "./cmd";

// #region Register Help Text

export function registerInlineHelp(category: string, helpText: string): void;
export function registerInlineHelp(category: string, subCategory: string, helpText: string): void;
export function registerInlineHelp(...args: string[]): void {
	registerHelp(...args);
}

export function registerCommandHelp(category: string, helpText: string): void;
export function registerCommandHelp(category: string, subCategory: string, helpText: string): void;
export function registerCommandHelp(...args: string[]): void {
	args[args.length - 1] = `! ${args[args.length - 1]}`;
	registerHelp(...args);
}

export function registerAdminCommandHelp(category: string, helpText: string): void;
export function registerAdminCommandHelp(category: string, subCategory: string, helpText: string): void;
export function registerAdminCommandHelp(category: string, subCategory: string, subSubCategory: string, helpText: string): void;
export function registerAdminCommandHelp(...args: string[]): void {
	args[args.length - 1] = `!! ${args[args.length - 1]}`;
	registerHelp(...args);
}

export function registerSearchHelp(category: string, helpText: string): void;
export function registerSearchHelp(category: string, subCategory: string, helpText: string): void;
export function registerSearchHelp(...args: string[]): void {
	args[args.length - 1] = `? ${args[args.length - 1]}`;
	registerHelp(...args);
}

export function registerFindHelp(category: string, helpText: string): void;
export function registerFindHelp(category: string, subCategory: string, helpText: string): void;
export function registerFindHelp(...args: string[]): void {
	args[args.length - 1] = `?! ${args[args.length - 1]}`;
	registerHelp(...args);
}

const helpTextMaps = new Map<string, string[]>();

function toHelpCategoryKey(categories: string[]): string {
	return categories.join(",").toLowerCase();
}
function registerHelp(...args: string[]): void {
	const helpText = args.pop()!;
	const helpCategoryKey = toHelpCategoryKey(args);
	if (!helpTextMaps.has(helpCategoryKey)) {
		helpTextMaps.set(helpCategoryKey, []);
	}
	const array = helpTextMaps.get(helpCategoryKey)!;
	array.push(helpText);
	array.sort();
}

// #endregion

//#region Help RenderableContent

function toCategoryDisplayText(helpCategory: string): string {
	const lower = helpCategory.toLowerCase();
	switch (lower) {
		case "find": return "search (name only)";
		case "search": return "search (full text)";
		default: return lower;
	}
}
function getHelpTexts(categoryKey: string): string[] {
	return helpTextMaps.get(categoryKey) || [];
}
function getHelpSubCategories(categoryKey: string, depth: number): string[] {
	return Array.from(helpTextMaps.keys())
		.filter(key => key.startsWith(categoryKey))
		.map(key => key.split(",").slice(depth)[0])
		.filter(toUniqueDefined)
		.sort()
		;
}
async function appendHelpSection(renderableContent: RenderableContent, prefix: string, helpCategoryKey: string): Promise<void> {
	const helpTexts = getHelpTexts(helpCategoryKey);
	renderableContent.appendTitledSection(`<i>${toCategoryDisplayText(helpCategoryKey.split(",").pop() || "")}</i>`);
	renderableContent.append(`${helpTexts.map(helpText => prefix + helpText).join("\n")}`);
}

type TSuperUserFilter = (value: string) => boolean;
function getSuperUserFilter(authorDid: Optional<Snowflake>): TSuperUserFilter {
	return getSuperUserId() === authorDid ? isDefined : (value: string) => value !== "SuperUser";
}
async function renderHelpAll(caches: SageCache): Promise<RenderableContent> {
	const renderableContent = createCommandRenderableContent();
	const prefix = caches.getPrefixOrDefault();
	renderableContent.appendTitledSection("<i>help syntax</i>", `<code>${prefix}!help {category}</code>`);
	subs([]);
	return renderableContent;

	function subs(catKey: string[]): void {
		const helpCategoryKey = toHelpCategoryKey(catKey),
			helpTexts = getHelpTexts(helpCategoryKey),
			helpSubCategories = getHelpSubCategories(helpCategoryKey, catKey.length);
		if (helpTexts.length) {
			renderableContent.appendTitledSection(helpCategoryKey);
			helpTexts.forEach(text => renderableContent.append(text));
		}
		if (helpSubCategories.length) {
			helpSubCategories.forEach(cat => {
				renderableContent.append(cat);
				subs(catKey.concat(cat));
			});
		}
	}
}
async function renderMainHelp(caches: SageCache): Promise<RenderableContent> {
	const renderableContent = createCommandRenderableContent();
	const suFilter = getSuperUserFilter(caches.userDid);
	const prefix = caches.getPrefixOrDefault();
	const categoriesOutput = getHelpSubCategories("", 0).filter(suFilter).join("\n").trim();
	renderableContent.appendTitledSection("<i>help syntax</i>", `<code>${prefix}!help {category}</code>`);
	renderableContent.appendTitledSection("Categories", categoriesOutput);
	renderableContent.appendTitledSection("<i>examples</i>", `<code>${prefix}!help command</code>`, `<code>${prefix}!help search</code>`);
	return renderableContent;
}
async function renderTextsOnly(caches: SageCache, categories: string[]): Promise<RenderableContent> {
	const renderableContent = createCommandRenderableContent();
	const prefix = caches.getPrefixOrDefault();
	const helpCategoryKey = toHelpCategoryKey(categories);
	appendHelpSection(renderableContent, prefix, helpCategoryKey);
	return renderableContent;
}
async function renderSubCategoriesOnly(caches: SageCache, categories: string[]): Promise<RenderableContent> {
	const renderableContent = createCommandRenderableContent(),
		helpCategoryKey = toHelpCategoryKey(categories),
		category = categories.slice().pop(),
		suFilter = getSuperUserFilter(caches.user?.id),
		helpSubCategories = getHelpSubCategories(helpCategoryKey, categories.length).filter(suFilter);
	let prefix = caches.getPrefixOrDefault();

	renderableContent.appendTitledSection(`<b>${category} syntax</b>`);
	if (helpSubCategories.length < 6) {
		prefix = category === "Dice" ? "" : prefix;
		for (const _subCategory of helpSubCategories) {
			const _prefix = category === "Dialog" && _subCategory !== "Alias" ? "" : prefix;
			await appendHelpSection(renderableContent, _prefix, `${helpCategoryKey},${_subCategory}`);
		}

	} else {
		renderableContent.append(`<code>${prefix}!help ${categories.join(" ").trim()} {subCategory}</code>`);
		renderableContent.appendTitledSection("SubCategories", helpSubCategories.join("\n").trim());
		/*
		// renderableContent.appendTitledSection("<i>examples</i>", `<code>${prefix}!help command</code>`, `<code>${prefix}!help search</code>`);
		*/

	}

	return renderableContent;
}
async function renderSubCategoriesAndText(caches: SageCache, categories: string[]): Promise<RenderableContent> {
	const renderableContent = createCommandRenderableContent(),
		helpCategoryKey = toHelpCategoryKey(categories),
		category = categories.slice().pop(),
		helpSubCategories = getHelpSubCategories(helpCategoryKey, categories.length);

	const subCatKeys = [helpCategoryKey, ...helpSubCategories.map(subCat => `${helpCategoryKey},${subCat}`)].sort();
	const prefix = category === "Dice" ? "" : caches.getPrefixOrDefault();
	for (const _subCategory of subCatKeys) {
		const _prefix = category === "Dialog" && _subCategory !== "Alias" ? "" : prefix;
		await appendHelpSection(renderableContent, _prefix, _subCategory);
	}

	return renderableContent;
}
function isHelpAll(categories: string[]): boolean {
	return categories.join("-") === "help-all";
}
function hasTextsOnly(categories: string[]): boolean {
	const helpCategoryKey = toHelpCategoryKey(categories),
		helpTexts = getHelpTexts(helpCategoryKey),
		helpSubCategories = getHelpSubCategories(helpCategoryKey, categories.length);
	return !!helpTexts.length && !helpSubCategories.length;
}
function hasSubCategoriesOnly(categories: string[]): boolean {
	const helpCategoryKey = toHelpCategoryKey(categories),
		helpTexts = getHelpTexts(helpCategoryKey),
		helpSubCategories = getHelpSubCategories(helpCategoryKey, categories.length);
	return !!categories[0] && !!helpSubCategories.length && !helpTexts.length;
}
function hasSubCategoriesAndText(categories: string[]): boolean {
	const helpCategoryKey = toHelpCategoryKey(categories),
		helpTexts = getHelpTexts(helpCategoryKey),
		helpSubCategories = getHelpSubCategories(helpCategoryKey, categories.length);
	return helpTexts.length !== 0 && helpSubCategories.length !== 0;
}
async function createHelpRenderable(caches: SageCache, categories: string[]): Promise<RenderableContent> {
	const renderableContent = createCommandRenderableContent(`<b>Sage Help</b>`);
	if (isHelpAll(categories)) {
		renderableContent.appendSections(...(await renderHelpAll(caches)).sections);
	} else if (hasTextsOnly(categories)) {
		renderableContent.appendSections(...(await renderTextsOnly(caches, categories)).sections);
	} else if (hasSubCategoriesOnly(categories)) {
		renderableContent.appendSections(...(await renderSubCategoriesOnly(caches, categories)).sections);
	} else if (hasSubCategoriesAndText(categories)) {
		renderableContent.appendSections(...(await renderSubCategoriesAndText(caches, categories)).sections);
	} else {
		renderableContent.appendSections(...(await renderMainHelp(caches)).sections);
	}
	renderableContent.appendTitledSection("Guides", `<a href="https://rpgsage.io">Command Guide</a>`, `<a href="https://rpgsage.io/quick.html">Quick Start Guide</a>`);
	return renderableContent;
}
//#endregion

// #region Render Help Text
function renderHelpTester(sageMessage: SageMessage): TCommandAndArgs | null {
	if (!sageMessage.hasPrefix) {
		return null;
	}

	if (getSuperUserId() === sageMessage?.message?.author?.id && sageMessage.slicedContent === "!help-all") {
		return {
			command: "help",
			args: new ArgsManager(["help", "all"])
		};
	}

	const match = sageMessage.slicedContent.match(/^\!{1,2}\s*help\s*([^$]*)$/i);
	if (match) {
		return {
			command: "help",
			args: undefined
		};
	}
	return null;
}
async function renderHelpHandler(sageMessage: SageMessage): Promise<void> {
	const renderableContent = createCommandRenderableContent(`<b>RPG Sage Help</b>`);
	renderableContent.appendTitledSection("Slash Command", `/sage help`);
	renderableContent.appendTitledSection("Guides", `<a href="https://rpgsage.io">Command Guide</a>`, `<a href="https://rpgsage.io/quick.html">Quick Start Guide</a>`);
	await send(sageMessage.caches, sageMessage.message.channel as TChannel, renderableContent, sageMessage.message.author);
}
// #endregion

//#region help slash commands

function helpSlashTester(sageInteraction: SageInteraction): boolean {
	return sageInteraction.isCommand("help");
}

async function helpSlashHandler(sageInteraction: SageInteraction): Promise<void> {
	const categories = sageInteraction.getString("category")?.split(",") ?? [];
	const renderableContent = await createHelpRenderable(sageInteraction.caches, categories);
	return sageInteraction.reply(renderableContent, true);
}

//#endregion

export function registerHelpCommands(): void {
	registerMessageListener(renderHelpTester, renderHelpHandler);
	registerInteractionListener(helpSlashTester, helpSlashHandler);
}
