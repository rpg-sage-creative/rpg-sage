import { filterAndMap, sortComparable, toUnique, toUniqueDefined } from "@rsc-utils/array-utils";
import { error, verbose } from "@rsc-utils/console-utils";
import { oneToUS } from "@rsc-utils/language-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import { capitalize } from "@rsc-utils/string-utils";
import { isDefined } from "@rsc-utils/type-utils";
import { HasSource, Repository, Skill, Source, SourceNotationMap } from "../../../sage-pf2e/index.js";
import { ArgsManager } from "../../discord/ArgsManager.js";
import { registerMessageListener } from "../../discord/handlers.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { TCommandAndArgs } from "../../discord/types.js";
import type { SageInteraction } from "../model/SageInteraction.js";
import type { SageMessage } from "../model/SageMessage.js";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd.js";
import { registerCommandHelp, registerFindHelp, registerSearchHelp } from "./help.js";
import { searchHandler } from "./search.js";

// #region Common Types and Functions

function renderAllSource(objectType: string, objectTypePlural: string): RenderableContent {
	const content = createCommandRenderableContent();
	const all = Repository.all<Source>(objectType), //.sort(sortComparable),
		categories = all.map(source => source.searchResultCategory).filter(toUnique);
	content.setTitle(`<b>${objectTypePlural} (${all.length})</b>`);
	categories.forEach(category => {
		const byCategory = filterAndMap(all, source => source.searchResultCategory === category, source => source.toSearchResult());
		content.append(`<b>${category} (${byCategory.length})</b>\n> ${byCategory.join("\n> ")}`);
	});
	return content;
}
function renderAllSkill(objectType: string, objectTypePlural: string): RenderableContent {
	const content = createCommandRenderableContent();
	const all = Repository.all<Skill>(objectType).sort(sortComparable);
	const sourceMap = new SourceNotationMap(all);

	const nonLore = all.filter(skill => !skill.isSpecialty);
	content.setTitle(`<b>${objectTypePlural} (${nonLore.length})</b>`);
	content.append(sourceMap.formatNames(nonLore, ", "));

	const lore = all.filter(skill => skill.isSpecialty && skill.parent!.name === "Lore");
	content.appendTitledSection(`<b>Lore Skills (${lore.length})</b>`, sourceMap.formatNames(lore, ", "));

	if (!sourceMap.isEmpty) {
		content.appendTitledSection(`Sources`, sourceMap.formatSourceNames("\n"));
	}
	return content;
}
// function sortCatWithRarity(a: string, b: string): -1 | 0 | 1 {
// 	if (a === b) return 0;
// 	const aParts = a.split(" ["), aLeft = aParts[0];
// 	const bParts = b.split(" ["), bLeft = bParts[0];
// 	const left = sortStringIgnoreCase(aLeft, bLeft);
// 	if (left === 0) return 0;
// 	const aRight = aParts[1]?.split("]")[0] ?? "", aRarity = RARITIES.indexOf(<any>aRight);
// 	const bRight = bParts[1]?.split("]")[0] ?? "", bRarity = RARITIES.indexOf(<any>bRight);
// 	if (aRarity !== bRarity) return aRarity < bRarity ? -1 : 1;
// 	return sortStringIgnoreCase(aRight, bRight);

// }
function renderAllBySource(objectType: string, objectTypePlural: string): RenderableContent[] {
	const _content = createCommandRenderableContent();
	const all = Repository.all<HasSource>(objectType).sort(sortComparable);
	_content.setTitle(`<b>${objectTypePlural} (${all.length})</b>`);

	const sources = Repository.all<Source>("Source");
	const mapped = sources.map(source => {
		const bySource = all.filter(item => item.source === source);
		if (bySource.length) {
			const content = createCommandRenderableContent();
			content.setTitle(`<b>${source.name} ${objectTypePlural} (${bySource.length})</b>`);
			const categories = bySource.map(hasSource => hasSource.searchResultCategory).filter(toUniqueDefined);
			// categories.sort(sortCatWithRarity);
			if (categories.length) {
				categories.forEach(category => {
					const byCategory = filterAndMap(bySource, item => item.searchResultCategory === category, item => item.toSearchResult());
					content.append(`<b>${category} (${byCategory.length})</b>\n> ${byCategory.join(", ")}`);
				});
			} else {
				content.append(bySource.map(item => item.toSearchResult()).join(", "));
			}
			return content;
		}
		return null;
	}).filter(isDefined);
	return [_content].concat(mapped);
}
export function renderAll(objectType: string, objectTypePlural: string, _bySource = false): RenderableContent[] {
	verbose("renderAll", objectType, objectTypePlural);
	try {
		if (objectType === "Source") {
			return [renderAllSource(objectType, objectTypePlural)];
		}
		if (objectType === "Skill") {
			return [renderAllSkill(objectType, objectTypePlural)];
		}
		if (_bySource) {
			return renderAllBySource(objectType, objectTypePlural);
		}
		const all = Repository.all<HasSource>(objectType).sort(sortComparable);
		const content = createCommandRenderableContent(`<b>${objectTypePlural} (${all.length})</b>`);
		SourceNotationMap.appendNotatedItems(content, all);
		return [content];
	} catch (ex) {
		error(ex);
	}
	return [];
}
// #endregion

async function objectsBy(sageMessage: SageMessage): Promise<void> {
	const objectTypePlural = sageMessage.args.shift()!,
		objectType = Repository.parseObjectType(oneToUS(objectTypePlural.replace(/gods/i, "deities")))!,
		traitOr = sageMessage.args.shift() ?? (objectType.objectType === "Deity" ? "domain" : "trait"),
		searchTerm = sageMessage.args.shift()!;

	const content = createCommandRenderableContent(),
		trait = traitOr === "trait" && Repository.findByValue("Trait", searchTerm),
		domain = traitOr === "domain" && Repository.findByValue("Domain", searchTerm);
	// source = traitOr === "source",

	content.setTitle(`<b>${objectType.objectTypePlural} by ${capitalize(traitOr)} (${searchTerm})</b>`);
	if (trait) {
		const capped = capitalize(searchTerm);
		/** @todo This uses weapon for all to expose traits ... create a HasTraits interface and properly implement */
		const items = Repository.filter(objectType.objectType as "Weapon", weapon => weapon.Traits?.includes(trait) || weapon.traits.includes(capped));
		if (items.length) {
			SourceNotationMap.appendNotatedItems(content, items);
		} else {
			content.append(`<blockquote><i>No Results Found.</i></blockquote>`);
			content.appendSection(`<a href="http://2e.aonprd.com/Search.aspx?query=${searchTerm.replace(/\s+/g, "+")}">Search Archives of Nethys</a>`);
		}
	} else if (domain) {
		const deities = Repository.filter(objectType.objectType as "Deity", deity => deity.hasDomain(domain));
		if (deities.length) {
			SourceNotationMap.appendNotatedItems(content, deities);
		} else {
			content.append(`<blockquote><i>No Results Found.</i></blockquote>`);
			content.appendSection(`<a href="http://2e.aonprd.com/Search.aspx?query=${searchTerm.replace(/\s+/g, "+")}">Search Archives of Nethys</a>`);
		}
	} else if (objectType.objectType === "Spell") {
		const capped = capitalize(searchTerm);
		const spells = Repository.filter("Spell", spell => spell.traits.includes(capped));
		if (spells.length) {
			SourceNotationMap.appendNotatedItems(content, spells);
		} else {
			content.append(`<blockquote><i>No Results Found.</i></blockquote>`);
			content.appendSection(`<a href="http://2e.aonprd.com/Search.aspx?query=${searchTerm.replace(/\s+/g, "+")}">Search Archives of Nethys</a>`);
		}
	} else {
		content.append(`<blockquote><i>Trait Not Found.</i></blockquote>`);
	}
	sageMessage.send(content);
}

// #region Search / Find / Default listeners

function searchTester(sageMessage: SageMessage): TCommandAndArgs | null {
	const slicedContent = sageMessage.slicedContent;
	if (sageMessage.hasPrefix && slicedContent.match(/^\?[^!].+$/)) {
		return {
			command: "search",
			args: new ArgsManager(slicedContent.slice(1))
		};
	}
	return null;
}

/** Checks searchText to see if the entire string is an object type, or an object type followed by "by source"; if so it lists all items of the given objectType */
// async function repositoryFind_listObjectType(sageMessage: SageMessage, searchInfo: TParsedSearchInfo): Promise<boolean> {
// 	if (searchInfo.objectTypes.length) return false;

// 	const bySourceMatch = searchInfo.searchText.match(/\s*(\w+)\s*by\s*source\s*/i);
// 	const bySource = bySourceMatch !== null;
// 	const objectType = bySource && bySourceMatch[1] || searchInfo.searchText;
// 	const usObjectType = oneToUS(objectType.replace(/^gods?$/i, "deity"));
// 	const pluralObjectType = Repository.parseObjectType(usObjectType);
// 	if (pluralObjectType) {
// 		const renderables = renderAll(pluralObjectType.objectType, pluralObjectType.objectTypePlural, bySource);
// 		for (const renderableContent of renderables) {
// 			await sageMessage.send(renderableContent);
// 		}
// 		return true;
// 	}
// 	return false;
// }
/** Checks searchText for the word table, then checks to see if the rest of the text is a table name; if so, renders table */
async function repositoryFindRenderTable(sageMessage: SageMessage): Promise<boolean> {
	const searchText = sageMessage.args.join(" ");
	const tableName = searchText.match(/\btable\b/i) && searchText.replace(/\btable\b/i, "") || "";
	const table = Repository.findByValue("Table", tableName);
	if (table) {
		await sageMessage.send(table);
		return true;
	}
	return false;
}
function findTester(sageMessage: SageMessage): TCommandAndArgs | null {
	const slicedContent = sageMessage.slicedContent;
	if (sageMessage.hasPrefix && slicedContent.match(/^\?\!.+$/)) {
		return {
			command: "find",
			args: new ArgsManager(slicedContent.slice(2))
		};
	}
	return null;
}
async function findHandler(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowSearch) {
		return sageMessage.reactBlock();
	}

	// if (await repositoryFind_listObjectType(sageMessage, parsedSearchInfo)) return;
	if (await repositoryFindRenderTable(sageMessage)) {
		return Promise.resolve();
	}
	return searchHandler(sageMessage, true);
}

// #endregion

//#region dm slash command

async function dmSlashHandler(sageInteraction: SageInteraction): Promise<void> {
	return sageInteraction.defer(true).then(deferred, failure);

	function deferred(): Promise<void> {
		const dmContent = `Hello!\nRPG Sage will now reply to your Direct Messages.\n*Note: Anytime RPG Sage is disconnected from Discord, you may need to reestablish this connection. We apologize for the inconvenience.*`;
		return sageInteraction.user.send(dmContent).then(success, failure);
	}
	function success(): Promise<void> {
		return sageInteraction.whisper(`Please check your DMs!`);
	}
	function failure(reason: any): Promise<void> {
		error(reason);
		return sageInteraction.whisper(`Sorry, there was a problem!`);
	}
}

//#endregion

export function registerDefault(): void {
	registerCommandRegex(/^\s*list\s*(weapons|armou?r|spells)\s*by\s*(trait)?\s*(\w+)$/i, objectsBy);
	registerCommandHelp("Lists", `list weapons by trait TRAIT`);
	registerCommandHelp("Lists", `list armor by trait TRAIT`);
	registerCommandHelp("Lists", `list spells by trait TRAIT`);

	registerCommandRegex(/^\s*list\s*(deities|gods)\s*by\s*(domain)?\s*(\w+)$/i, objectsBy);
	registerCommandHelp("Lists", `list deities by domain DOMAIN`);
	registerCommandHelp("Lists", `list gods by domain DOMAIN`);

	registerMessageListener(searchTester, searchHandler);
	registerSearchHelp("Search", `WORD OR WORDS`);
	registerSearchHelp("Search", `WORD OR WORDS -CATEGORY\n\tCATEGORY can be armor, spell, weapon, etc.`);

	registerMessageListener(findTester, findHandler);
	registerFindHelp("Search", "Find", `WORD OR WORDS`);
	registerFindHelp("Search", "Find", `WORD OR WORDS -CATEGORY\n\tCATEGORY can be armor, spell, weapon, etc.`);

	registerCommandRegex(/shutdown/, async (sageMessage: SageMessage) => {
		if (sageMessage.canSuperAdmin) {
			await sageMessage.reactSuccess();
			process.exit(0);
		}
	});

	registerListeners({ commands:["dm"], interaction:dmSlashHandler });
}
