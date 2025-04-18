import type { SearchInfo, SearchScore, RenderableContent as UtilsRenderableContent } from "@rsc-utils/core-utils";
import { MDASH, NEWLINE, TAB, type TWeaponCategory, type TWeaponGroup, type TWeaponHands, type TWeaponType } from "../common.js";
import { RenderableContent } from "../data/RenderableContent.js";
import { filter, findByValue } from "../data/Repository.js";
import type { Ammunition } from "./Ammunition.js";
import { HasBulk, type BulkCore } from "./HasBulk.js";
import type { Trait } from "./Trait.js";
import type { WeaponGroup } from "./WeaponGroup.js";

export interface WeaponCore extends BulkCore<"Weapon"> {
	ammunition?: string;
	category: TWeaponCategory;
	damage?: string;
	group: TWeaponGroup;
	hands: TWeaponHands;
	level: number;
	price?: string;
	range?: string;
	reload?: string;
	type: TWeaponType;
}

export class Weapon extends HasBulk<WeaponCore, Weapon> {

	/**************************************************************************************************************************/
	// Properties

	public get ammunition(): Ammunition | undefined { return findByValue("Ammunition", this.core.ammunition); }
	public get category(): TWeaponCategory { return this.core.category; }
	public get damage(): string | undefined { return this.core.damage; }
	private _group?: WeaponGroup | null;
	public get group(): WeaponGroup | undefined {
		if (this._group === undefined) {
			this._group = findByValue("WeaponGroup", this.core.group) ?? null;
		}
		return this._group ?? undefined;
	}
	public get hands(): "1" | "1+" | "2" { return this.core.hands || null; }
	public isEquippable = true;
	public get level(): number { return this.core.level || 0; }
	public get price(): string | undefined { return this.core.price; }
	public get range(): string | undefined { return this.core.range; }
	public get reload(): string | undefined { return this.core.reload; }
	private _Traits?: Trait[];
	public get Traits(): Trait[] {
		if (!this._Traits) {
			const coreTraits = this.nonRarityTraits.map(t => t.split(/ /)[0]);
			this._Traits = filter("Trait", trait => coreTraits.includes(trait.name));
		}
		return this._Traits;
	}
	public get type(): TWeaponType { return this.core.type || null; }

	public toRenderableContent(): UtilsRenderableContent {
		const content = new RenderableContent(this);

		const level = this.level ? `(level ${this.level})` : ``;
		const title = `<b>${this.name}</b> ${level}`;
		content.setTitle(title);

		content.append(`${this.rarity} ${this.category} ${this.type} Weapon`);

		content.append(`<b>Price</b> ${this.price || MDASH}`);

		content.append(`<b>Damage</b> ${this.damage}`);
		if (this.type === "Ranged") {
			content.append(`<b>Range</b> ${this.range}; <b>Reload</b> ${this.reload}`);
		}

		const groupTraits = [];
		if (this.group) {
			groupTraits.push(`<b>Group</b> ${this.group || MDASH}`);
		}
		groupTraits.push(`<b>Traits</b> ${this.nonRarityTraits.join(", ") || MDASH}`);
		content.append(groupTraits.join("; "));

		content.append(`<b>Hands</b> ${this.hands}; ${this.toRenderableBulkString()}`);

		content.append(...this.details.map((d, i) => (i ? TAB : NEWLINE) + d));

		if (this.group) {
			content.appendSections(this.group.toRenderableContentTitledSection());
		}
		this.Traits.forEach(trait => content.appendTitledSection(`<b>Trait</b> ${trait}`, ...trait.details.map((d, i) => (i ? TAB : NEWLINE) + d)));

		return content;
	}

	/**************************************************************************************************************************/
	// Searchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			const terms: string[] = [];
			if (this.category) {
				terms.push(this.category);
			}
			if (this.group) {
				terms.push(this.group.name);
			}
			if (this.price) {
				terms.push(this.price);
			}
			if (this.type) {
				terms.push(this.type);
			}
			terms.push(...this.Traits.map(trait => trait.name));
			score.append(searchInfo.score(this, terms));
		}
		return score;
	}

}
