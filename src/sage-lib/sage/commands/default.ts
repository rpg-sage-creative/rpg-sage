import { Armor, HasSource, IHasTraits, RARITIES, Repository, Skill, Source, SourceNotationMap, type TRarity } from "../../../sage-pf2e";
import utils from "../../../sage-utils";
import ArgsManager from "../../discord/ArgsManager";
import { resolveToEmbeds } from "../../discord/embeds";
import { registerMessageListener } from "../../discord/handlers";
import { send } from "../../discord/messages";
import type { TChannel, TCommandAndArgs } from "../../discord/types";
import type SageMessage from "../model/SageMessage";
import type SageMessageArgsManager from "../model/SageMessageArgsManager";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp, registerFindHelp, registerSearchHelp } from "./help";

// #region Common Types and Functions

function renderAllSource(objectType: string, objectTypePlural: string): utils.RenderUtils.RenderableContent {
	const content = createCommandRenderableContent();
	const all = Repository.all<Source>(objectType), //.sort(utils.ArrayUtils.Sort.sortComparable),
		categories = all.map(source => source.searchResultCategory).filter(utils.ArrayUtils.Filters.unique);
	content.setTitle(`<b>${objectTypePlural} (${all.length})</b>`);
	categories.forEach(category => {
		const byCategory = utils.ArrayUtils.Collection.filterThenMap(all, source => source.searchResultCategory === category, source => source.toSearchResult());
		content.append(`<b>${category} (${byCategory.length})</b>\n> ${byCategory.join("\n> ")}`);
	});
	return content;
}
function renderAllSkill(objectType: string, objectTypePlural: string): utils.RenderUtils.RenderableContent {
	const content = createCommandRenderableContent();
	const all = Repository.all<Skill>(objectType).sort(utils.ArrayUtils.Sort.sortComparable);
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
// 	const left = utils.ArrayUtils.Sort.stringIgnoreCase(aLeft, bLeft);
// 	if (left === 0) return 0;
// 	const aRight = aParts[1]?.split("]")[0] ?? "", aRarity = RARITIES.indexOf(<any>aRight);
// 	const bRight = bParts[1]?.split("]")[0] ?? "", bRarity = RARITIES.indexOf(<any>bRight);
// 	if (aRarity !== bRarity) return aRarity < bRarity ? -1 : 1;
// 	return utils.ArrayUtils.Sort.stringIgnoreCase(aRight, bRight);

// }
function renderAllBySource(objectType: string, objectTypePlural: string): utils.RenderUtils.RenderableContent[] {
	const _content = createCommandRenderableContent();
	const all = Repository.all<HasSource>(objectType).sort(utils.ArrayUtils.Sort.sortComparable);
	_content.setTitle(`<b>${objectTypePlural} (${all.length})</b>`);

	const sources = Repository.all<Source>("Source");
	const mapped = sources.map(source => {
		const bySource = all.filter(item => item.source === source);
		if (bySource.length) {
			const content = createCommandRenderableContent();
			content.setTitle(`<b>${source.name} ${objectTypePlural} (${bySource.length})</b>`);
			const categories = bySource.map(hasSource => hasSource.searchResultCategory).filter(utils.ArrayUtils.Filters.existsAndUnique);
			// categories.sort(sortCatWithRarity);
			if (categories.length) {
				categories.forEach(category => {
					const byCategory = utils.ArrayUtils.Collection.filterThenMap(bySource, item => item.searchResultCategory === category, item => item.toSearchResult());
					content.append(`<b>${category} (${byCategory.length})</b>\n> ${byCategory.join(", ")}`);
				});
			} else {
				content.append(bySource.map(item => item.toSearchResult()).join(", "));
			}
			return content;
		}
		return null;
	}).filter(utils.ArrayUtils.Filters.exists);
	return [_content].concat(mapped);
}
export function renderAll(objectType: string, objectTypePlural: string, _bySource = false): utils.RenderUtils.RenderableContent[] {
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
		const all = Repository.all<HasSource>(objectType).sort(utils.ArrayUtils.Sort.sortComparable);
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
	const objectTypePlural = sageMessage.args.shift()!,
		objectType = Repository.parseObjectType(utils.LangUtils.oneToUS(objectTypePlural.replace(/gods/i, "deities")))!,
		traitOr = sageMessage.args.shift() ?? (objectType.objectType === "Deity" ? "domain" : "trait"),
		searchTerm = sageMessage.args.shift()!;

	const content = createCommandRenderableContent(),
		trait = traitOr === "trait" && Repository.findByValue("Trait", searchTerm),
		domain = traitOr === "domain" && Repository.findByValue("Domain", searchTerm);
	// source = traitOr === "source",
	content.setTitle(`<b>${objectType.objectTypePlural} by ${utils.StringUtils.capitalize(traitOr)} (${searchTerm})</b>`);
	if (trait) {
		// TODO: This uses weapon for all to expose traits ... create a HasTraits interface and properly implement
		const items = Repository.filter(objectType.objectType as "Weapon", weapon => weapon.Traits.includes(trait));
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
		const capped = utils.StringUtils.capitalize(searchTerm);
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

type TParsedSearchInfo = { searchText: string; searchTerms: string[]; objectTypes: string[]; rarities: TRarity[] };
function parseSearchInfo(sageMessageArgs: SageMessageArgsManager): TParsedSearchInfo {
	const searchTerm = sageMessageArgs.join(" ");
	const matches = Array.from(searchTerm.match(/\s+[\-\\/][a-z]+/g) || []).filter(match => match.trim() !== "-r");

	const lowerRarities = RARITIES.map(rarity => rarity.toLowerCase());
	const rarities = matches.filter(match => lowerRarities.includes(match.trim().slice(1).toLowerCase()));
	const objectTypes = matches.filter(match => !rarities.includes(match));

	const cleaned = matches.reduce((_cleaned, match) => _cleaned.replace(match, ""), searchTerm);
	const searchText = utils.StringUtils.cleanWhitespace(cleaned);
	return {
		searchText: searchText,
		searchTerms: searchText.split(/\s+/),
		objectTypes: objectTypes.map(objectType => objectType.trim().slice(1)),
		rarities: RARITIES.filter(rarity => rarities.find(r => r.trim().slice(1).toLowerCase() === rarity.toLowerCase()))
	};
}

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

async function searchHandler(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowSearch) {
		return sageMessage.reactBlock();
	}

	const searchInfo = parseSearchInfo(sageMessage.args);
	const searchResults = Repository.search(new utils.SearchUtils.SearchInfo(searchInfo.searchText, "g"), ...searchInfo.objectTypes);
	if (searchInfo.rarities.length && searchResults.scores.length) {
		searchResults.scores = searchResults.scores.filter(score => {
			// TODO: Properly implement IHasTraits so that I can use .hasTraits and .includesTrait
			const hasTraits = (<IHasTraits><any>score.searchable);
			if (hasTraits.traits?.length) {
				return searchInfo.rarities.find(rarity => hasTraits.traits.includes(rarity)) !== undefined;
			}
			return true;
		});
	}
	await send(sageMessage.caches, sageMessage.message.channel as TChannel, searchResults.theOne ?? searchResults, sageMessage.message.author);
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
async function repositoryFindRenderTable(sageMessage: SageMessage, searchInfo: TParsedSearchInfo): Promise<boolean> {
	const searchText = searchInfo.searchText;
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

	const message = sageMessage.message;
	const searchInfo = parseSearchInfo(sageMessage.args);

	// if (await repositoryFind_listObjectType(sageMessage, searchInfo)) return;

	if (await repositoryFindRenderTable(sageMessage, searchInfo)) {
		return;
	}

	let searchResults = Repository.search(new utils.SearchUtils.SearchInfo(searchInfo.searchText), ...searchInfo.objectTypes);
	if (searchResults.isEmpty) {
		searchResults = Repository.searchComparison(new utils.SearchUtils.SearchInfo(searchInfo.searchText), ...searchInfo.objectTypes);
	}

	/** If no results and searchText ends in "armor" remove trailing "armor" and search again; example: Studded Leather Armor */
	if (searchResults.isEmpty && searchInfo.searchText.match(/\s*armou?r\s*$/)) {
		const armorSearchResults = Repository.search<Armor>(new utils.SearchUtils.SearchInfo(searchInfo.searchText.replace(/\s*armou?r\s*$/, "")), "Armor");
		if (!armorSearchResults.isEmpty) {
			searchResults = armorSearchResults;
		}
	}
	await send(sageMessage.caches, message.channel as TChannel, searchResults.theOne ?? searchResults.theMatch ?? searchResults, message.author);
}

// #endregion

export default function register(): void {
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

	registerCommandRegex(/debug\-log\-all\-items/, async (sageMessage: SageMessage) => {
		if (sageMessage.isSuperUser) {
			console.log(`debug-log-all-items: begin`);
			let maxEmbeds = 0;
			let maxCharacters = 0;
			const clean = <string[]>[];
			const objectTypes = Repository.getObjectTypes();
			for (const objectType of objectTypes) {
				console.log(`\tdebug-log-all-items(${objectType}): begin`);
				const broken = <string[]>[];
				const objects = Repository.all(objectType);
				for (const object of objects) {
					try {
						// console.log(`\t\t${objectType}::${object.id}::${object.name}`);
						const renderable = object.toRenderableContent();
console.log((renderable as any)?.prototype?.constructor?.name ?? Object.prototype.toString.call(object));
						const embeds = resolveToEmbeds(sageMessage.caches, renderable);
						maxEmbeds = Math.max(maxEmbeds, embeds.length);
						const string = renderable.toString();
						maxCharacters = Math.max(maxCharacters, string.length);
					} catch (ex) {
						broken.push(`${object.id}::${object.name}`);
						// console.error(ex);
					}
				}
				if (!broken.length) {
					clean.push(objectType);
				} else {
					await sageMessage.send(`__**${objectType}: ${broken.length} errors.**__\n${broken.join("\n")}`);
				}
				console.log(`\tdebug-log-all-items(${objectType}): end`);
			}
			await sageMessage.send(`__**Clean Objects (${clean.length}):**__ ${clean.join(", ")}; maxEmbeds (${maxEmbeds}), maxCharacters (${maxCharacters})`);
			console.log(`debug-log-all-items: end`);
		}
	});
}
