import { capitalize, oneToUS } from "@rsc-utils/core-utils";
import { Repository, SourceNotationMap } from "../../../../sage-pf2e/index.js";
import { createAon2eSearchLink } from "../../../../sage-search/aon/2e/createAon2eSearchLink.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { createCommandRenderableContent, registerCommandRegex } from "../cmd.js";

async function listObjectsBy(sageMessage: SageMessage): Promise<void> {
	const args = sageMessage.args.manager.raw();
	const objectTypePlural = args.shift()!,
		objectType = Repository.parseObjectType(oneToUS(objectTypePlural.toLowerCase().replace("gods", "deities")))!,
		traitOr = args.shift() ?? (objectType.objectType === "Deity" ? "domain" : "trait"),
		searchTerm = args.shift()!;

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
			content.appendSection(createAon2eSearchLink("PF2e", searchTerm));
		}
	} else if (domain) {
		const deities = Repository.filter(objectType.objectType as "Deity", deity => deity.hasDomain(domain));
		if (deities.length) {
			SourceNotationMap.appendNotatedItems(content, deities);
		} else {
			content.append(`<blockquote><i>No Results Found.</i></blockquote>`);
			content.appendSection(createAon2eSearchLink("PF2e", searchTerm));
		}
	} else if (objectType.objectType === "Spell") {
		const capped = capitalize(searchTerm);
		const spells = Repository.filter("Spell", spell => spell.traits.includes(capped));
		if (spells.length) {
			SourceNotationMap.appendNotatedItems(content, spells);
		} else {
			content.append(`<blockquote><i>No Results Found.</i></blockquote>`);
			content.appendSection(createAon2eSearchLink("PF2e", searchTerm));
		}
	} else {
		content.append(`<blockquote><i>Trait Not Found.</i></blockquote>`);
	}
	sageMessage.send(content);
}

export function registerListObjectsBy(): void {
	// const commands = [
	// 	/^\s*list\s*(weapons|armou?r|spells)\s*by\s*(trait)?\s*(\w+)$/i,
	// 	/^\s*list\s*(deities|gods)\s*by\s*(domain)?\s*(\w+)$/i,
	// ];
	// registerListeners({ commands, message:listObjectsBy })
	registerCommandRegex(/^\s*list\s*(weapons|armou?r|spells)\s*by\s*(trait)?\s*(\w+)$/i, listObjectsBy);
	registerCommandRegex(/^\s*list\s*(deities|gods)\s*by\s*(domain)?\s*(\w+)$/i, listObjectsBy);
}
