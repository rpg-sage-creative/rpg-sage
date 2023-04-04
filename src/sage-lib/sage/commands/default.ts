import { HasSource, Source, SourceNotationMap } from "../../../sage-pf2e";
import { filterBy, findByValue, getByType } from "../../../sage-pf2e/data";
import { parseObjectType } from "../../../sage-pf2e/data/repoMap";
import type { Skill } from "../../../sage-pf2e/model/Skill";
import { isDefined } from "../../../sage-utils";
import { ArgsManager } from "../../../sage-utils/ArgsUtils";
import { Collection, isDefinedAndUnique, isUnique, sortComparable } from "../../../sage-utils/ArrayUtils";
import { oneToUS } from "../../../sage-utils/LangUtils";
import type { RenderableContent } from "../../../sage-utils/RenderUtils";
import { capitalize } from "../../../sage-utils/StringUtils";
import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types";
import { registerInteractionListener, registerMessageListener } from "../../discord/handlers";
import type { TCommandAndArgs } from "../../discord/types";
import type { SageInteraction } from "../model/SageInteraction";
import type { SageMessage } from "../model/SageMessage";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp, registerFindHelp, registerSearchHelp } from "./help";
import { searchHandler } from "./search";

// #region Common Types and Functions

function renderAllSource(objectType: string, objectTypePlural: string): RenderableContent {
	const content = createCommandRenderableContent();
	const all = getByType<Source>(objectType), //.sort(sortComparable),
		categories = all.map(source => source.searchResultCategory).filter(isUnique);
	content.setTitle(`<b>${objectTypePlural} (${all.length})</b>`);
	categories.forEach(category => {
		const byCategory = Collection.filterThenMap(all, source => source.searchResultCategory === category, source => source.toSearchResult());
		content.append(`<b>${category} (${byCategory.length})</b>\n> ${byCategory.join("\n> ")}`);
	});
	return content;
}
function renderAllSkill(objectType: string, objectTypePlural: string): RenderableContent {
	const content = createCommandRenderableContent();
	const all = getByType<Skill>(objectType).sort(sortComparable);
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
// 	const left = stringIgnoreCase(aLeft, bLeft);
// 	if (left === 0) return 0;
// 	const aRight = aParts[1]?.split("]")[0] ?? "", aRarity = RARITIES.indexOf(<any>aRight);
// 	const bRight = bParts[1]?.split("]")[0] ?? "", bRarity = RARITIES.indexOf(<any>bRight);
// 	if (aRarity !== bRarity) return aRarity < bRarity ? -1 : 1;
// 	return stringIgnoreCase(aRight, bRight);

// }
function renderAllBySource(objectType: string, objectTypePlural: string): RenderableContent[] {
	const _content = createCommandRenderableContent();
	const all = getByType<HasSource>(objectType).sort(sortComparable);
	_content.setTitle(`<b>${objectTypePlural} (${all.length})</b>`);

	const sources = getByType<Source>("Source");
	const mapped = sources.map(source => {
		const bySource = all.filter(item => item.source === source);
		if (bySource.length) {
			const content = createCommandRenderableContent();
			content.setTitle(`<b>${source.name} ${objectTypePlural} (${bySource.length})</b>`);
			const categories = bySource.map(hasSource => hasSource.searchResultCategory).filter(isDefinedAndUnique);
			// categories.sort(sortCatWithRarity);
			if (categories.length) {
				categories.forEach(category => {
					const byCategory = Collection.filterThenMap(bySource, item => item.searchResultCategory === category, item => item.toSearchResult());
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
	console.info("renderAll", objectType, objectTypePlural);
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
		const all = getByType<HasSource>(objectType).sort(sortComparable);
		const content = createCommandRenderableContent(`<b>${objectTypePlural} (${all.length})</b>`);
		SourceNotationMap.appendNotatedItems(content, all);
		return [content];
	} catch (ex) {
		console.error(ex);
	}
	return [];
}
// #endregion

async function objectsBy(sageMessage: SageMessage): Promise<void> {
	const argValues = sageMessage.args.unkeyedValues();
	const objectTypePlural = argValues.shift(),
		objectType = parseObjectType(oneToUS(objectTypePlural!.replace(/gods/i, "deities")))!,
		traitOr = argValues.shift() ?? (objectType.objectType === "Deity" ? "domain" : "trait"),
		searchTerm = argValues.shift()!;

	const content = createCommandRenderableContent(),
		trait = traitOr === "trait" && findByValue("Trait", searchTerm),
		domain = traitOr === "domain" && findByValue("Domain", searchTerm);
	// source = traitOr === "source",

	content.setTitle(`<b>${objectType.objectTypePlural} by ${capitalize(traitOr)} (${searchTerm})</b>`);
	if (trait) {
		const capped = capitalize(searchTerm);
		/** @todo This uses weapon for all to expose traits ... create a HasTraits interface and properly implement */
		const items = filterBy(objectType.objectType as "Weapon", weapon => weapon.Traits?.includes(trait) || weapon.traits.includes(capped));
		if (items.length) {
			SourceNotationMap.appendNotatedItems(content, items);
		} else {
			content.append(`<blockquote><i>No Results Found.</i></blockquote>`);
			content.appendSection(`<a href="http://2e.aonprd.com/Search.aspx?query=${searchTerm.replace(/\s+/g, "+")}">Search Archives of Nethys</a>`);
		}
	} else if (domain) {
		const deities = filterBy(objectType.objectType as "Deity", deity => deity.hasDomain(domain));
		if (deities.length) {
			SourceNotationMap.appendNotatedItems(content, deities);
		} else {
			content.append(`<blockquote><i>No Results Found.</i></blockquote>`);
			content.appendSection(`<a href="http://2e.aonprd.com/Search.aspx?query=${searchTerm.replace(/\s+/g, "+")}">Search Archives of Nethys</a>`);
		}
	} else if (objectType.objectType === "Spell") {
		const capped = capitalize(searchTerm);
		const spells = filterBy("Spell", spell => spell.traits.includes(capped));
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
			args: ArgsManager.tokenize(slicedContent.slice(1))
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
// 	const usObjectType = utils.LangUtils.oneToUS(objectType.replace(/^gods?$/i, "deity"));
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
	const searchText = sageMessage.args.unkeyedValues().join(" ");
	const tableName = searchText.match(/\btable\b/i) && searchText.replace(/\btable\b/i, "") || "";
	const table = findByValue("Table", tableName);
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
			args: ArgsManager.tokenize(slicedContent.slice(2))
		};
	}
	return null;
}
async function findHandler(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Game Content Find");
	if (denial) {
		return denial;
	}

	// if (await repositoryFind_listObjectType(sageMessage, parsedSearchInfo)) return;
	if (await repositoryFindRenderTable(sageMessage)) {
		return Promise.resolve();
	}
	return searchHandler(sageMessage, true);
}

// #endregion

//#region dm slash command

function dmSlashTester(sageInteraction: SageInteraction): boolean {
	return sageInteraction.isCommand("DM");
}
async function dmSlashHandler(sageInteraction: SageInteraction): Promise<void> {
	return sageInteraction.defer(true).then(deferred, failure);

	function deferred(): Promise<void> {
		const dmContent = `Hello!\nRPG Sage will now reply to your Direct Messages.\n*Note: Anytime RPG Sage is disconnected from Discord, you will need to reestablish this channel. I apologize for the inconvenience.*`;
		return sageInteraction.actor.d.send(dmContent).then(success, failure);
	}
	function success(): Promise<void> {
		return sageInteraction.reply(`Please check your DMs!`, true);
	}
	function failure(reason: any): Promise<void> {
		console.error(reason);
		return sageInteraction.reply(`Sorry, there was a problem!`, true);
	}
}
function dmCommand(): TSlashCommand {
	return {
		"name": "DM",
		"description": "Establish direct message channel with RPG Sage."
	};
}

//#endregion

export function registerCommandHandlers(): void {
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

	registerInteractionListener(dmSlashTester, dmSlashHandler);
}

export function registerSlashCommands(): void {
	registerSlashCommand(dmCommand());
}
