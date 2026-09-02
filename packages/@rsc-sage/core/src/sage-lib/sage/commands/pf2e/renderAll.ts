import { error, filterAndMap, isDefined, sortComparable, toUnique, toUniqueDefined, verbose, type RenderableContent } from "@rsc-utils/core-utils";
import { HasSource, Repository, Skill, Source, SourceNotationMap } from "../../../../sage-pf2e/index.js";
import { createCommandRenderableContent } from "../cmd.js";

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
