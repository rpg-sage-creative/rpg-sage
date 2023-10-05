import utils from "../../sage-utils";

import * as Repository from '../data/Repository';

import { warn } from "../../sage-utils/utils/ConsoleUtils";
import type Domain from "./Domain";
import type Skill from './Skill';
import type Spell from './Spell';

export type TDevoteeBenefitsCore = {
	divineFont: string[];
	divineSkill: string[];
	favoredWeapon: string;
	domains: string[];
	clericSpells: string[];
	alternateDomains: string[];
};

export default class DevoteeBenefits {

	public constructor(private core: TDevoteeBenefitsCore) { }

	private _divineFont?: Spell[];
	public get divineFont(): Spell[] { return this._divineFont ?? (this._divineFont = this.core.divineFont.map(spellName => Repository.findByValue("Spell", spellName)!)); }

	private _divineSkill?: Skill[];
	public get divineSkill(): Skill[] { return this._divineSkill ?? (this._divineSkill = this.core.divineSkill.map(skillName => Repository.findByValue("Skill", skillName)!)); }

	public get favoredWeapon(): string { return this.core.favoredWeapon; }

	private _domains?: Domain[];
	public get domains(): Domain[] { return this._domains ?? (this._domains = this.core.domains.map(domainName => Repository.findByValue("Domain", domainName)!)); }

	private _clericSpells?: Spell[];
	public get clericSpells(): Spell[] { return this._clericSpells ?? (this._clericSpells = this.core.clericSpells.map(spell => Repository.findByValue("Spell", spell.split(/\s*\(/)[0])!)); }

	private _alternateDomains?: Domain[];
	public get alternateDomains(): Domain[] { return this._alternateDomains ?? (this._alternateDomains = (this.core.alternateDomains || []).map(domainName => Repository.findByValue("Domain", domainName)!)); }

	public fontToContent(index: number): string {
		const spell = this.divineFont[index];
		if (spell) {
			return spell.nameLower.italics();
		}
		const spellName = this.core.divineFont[index];
		warn(`Missing Deity Divine Font: ${spellName}`);
		return spellName.toLowerCase().italics();
	}
	public domainToContent(index: number): string {
		const domain = this.domains[index];
		if (domain) {
			return domain.nameLower;
		}
		const domainName = this.core.domains[index];
		warn(`Missing Deity Domain: ${domainName}`);
		return domainName.toLowerCase();
	}
	public spellToContent(index: number): string {
		const spell = this.clericSpells[index];
		if (spell) {
			return `${utils.NumberUtils.nth(spell.level)}: <i>${this.core.clericSpells[index].toLowerCase()}</i>`;
		}
		const spellName = this.core.clericSpells[index];
		const found = Repository.findByValue("Spell", spellName.split(/\s*\(/)[0]);
		warn(found ? `TyPo Deity Spell: ${spellName}` : `Missing Deity Spell: ${spellName}`);
		return `?: <i>${spellName.toLowerCase()}</i>`;
	}
	public alternateDomainToContent(index: number): string {
		const domain = this.alternateDomains[index];
		if (domain) {
			return domain.nameLower;
		}
		const domainName = (this.core.alternateDomains || [])[index];
		warn(`Missing Deity Alternate Domain: ${domainName}`);
		return domainName.toLowerCase();
	}
}
