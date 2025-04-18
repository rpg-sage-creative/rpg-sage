import type { RenderableContent as UtilsRenderableContent } from "@rsc-utils/core-utils";
import { RenderableContent } from "../data/RenderableContent.js";
import type { TDevoteeBenefitsCore } from "./DevoteeBenefits.js";
import { DevoteeBenefits } from "./DevoteeBenefits.js";
import type { Domain } from "./Domain.js";
import type { FaithCoreBase } from "./Faith.js";
import { Faith } from "./Faith.js";

export type TDeitySpell = {
	level: number;
	name: string;
};

export interface DeityCore extends FaithCoreBase<"Deity"> {
	devoteeBenefits: TDevoteeBenefitsCore;
}

//TODO: cleanup the data to not need these xxxToContent functions
//TODO: figure out how to handle spells with (x only) or (appears as x) alterations

export class Deity extends Faith<"Deity", DeityCore> {

	public constructor(core: DeityCore) {
		super(core);
		this.devoteeBenefits = new DevoteeBenefits(core.devoteeBenefits);
	}

	/**************************************************************************************************************************/
	// Properties

	public devoteeBenefits: DevoteeBenefits;

	public hasDomain(domain: Domain): boolean { return this.devoteeBenefits.domains.includes(domain) || this.devoteeBenefits.alternateDomains.includes(domain); }

	/**************************************************************************************************************************/
	// Renderable

	public toRenderableContent(): UtilsRenderableContent {
		const content = new RenderableContent(this);
		if (this.source.isCore) {
			content.setThumbnailUrl(`http://rpgsage.io/images/religious/${this.name.replace(/\s/g, "")}.png`);
		}
		content.setTitle(`<b>${this.name}</b>`);
		this.appendDetailsTo(content);
		content.append(`<blockquote><b>Edicts</b> ${this.edicts.join(this.edicts.find(e => e.includes(",")) ? "; " : ", ")}</blockquote>`);
		content.append(`<blockquote><b>Anathema</b> ${this.anathema.join(this.anathema.find(a => a.includes(",")) ? "; " : ", ")}</blockquote>`);
		content.append(`<h1>Devotee Benefits</h1>`);
		content.append(`<b>Divine Font</b> ${this.devoteeBenefits.divineFont.map(spell => italicize(spell.nameLower)).join(" or ")}`);
		content.append(`<b>Divine Skill</b> ${this.devoteeBenefits.divineSkill.length > 1 ? doDivineSkills(this.devoteeBenefits.divineSkill) : this.devoteeBenefits.divineSkill[0].name}`);
		content.append(`<b>Favored Weapon</b> ${this.devoteeBenefits.favoredWeapon.toLowerCase()}`);
		content.append(`<b>Domains</b> ${this.devoteeBenefits.domains.map((_, index) => this.devoteeBenefits.domainToContent(index)).join(", ")}`);
		content.append(`<b>Cleric Spells</b> ${this.devoteeBenefits.clericSpells.map((_, index) => this.devoteeBenefits.spellToContent(index)).join(", ")}`);
		content.append(`<b>Alternate Domains</b> ${this.devoteeBenefits.alternateDomains.map((_, index) => this.devoteeBenefits.alternateDomainToContent(index)).join(", ")}`);

		const spells = this.devoteeBenefits.divineFont.concat(this.devoteeBenefits.clericSpells);
		content.addAonLink(...spells.filter(spell => !!spell).map(spell => spell.toAonLink()));

		return content;
	}

}
function italicize(s: string): string {
	return `<i>${s}</i>`;
}
function doDivineSkills(skills: any[]): string {
	return `select ${skills.join(" or ")}`;
}