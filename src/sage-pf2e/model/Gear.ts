import { asStringIgnoreCase } from "../../sage-utils/ArrayUtils";
import type { SearchInfo, SearchScore } from "../../sage-utils/SearchUtils";
import type { IHasContents, TObjectQuantity } from "../common";
import { COMMON, MDASH } from "../common";
import { Pf2eRenderableContent } from "../Pf2eRenderableContent";
import { findByValue } from "../data";
import type { TDetail } from "./base/interfaces";
import { Coins } from "./Coins";
import type { GearCategory } from "./GearCategory";
import type { BulkCore } from "./HasBulk";
import { HasBulk } from "./HasBulk";
import type { RenderableContent } from "../../sage-utils/RenderUtils";

//#region Helpers

function contentsToString(...contents: TObjectQuantity<Gear>[]): string {
	return contents.map(contentToString).join(", ");
}

function contentToString(objectQuantity: TObjectQuantity<Gear>): string {
	const name = objectQuantity.object.name,
		contents = contentsToString(...objectQuantity.contents),
		contentsString = contents ? ` (${contents})` : ``,
		quantity = (objectQuantity.quantity || 1) * (objectQuantity.object.quantity || 1),
		quantityString = quantity > 1 ? ` x${quantity}` : ``;
	return `${name}${contentsString}${quantityString}`;
}

export function sortGear(a: Gear, b: Gear): number {
	if (a.category && b.category && a.category !== b.category) {
		return asStringIgnoreCase(`${a.category.name || ""}${a.name}`, `${b.category.name || ""}${b.name}`);
	}
	if (!a.category) {
		return asStringIgnoreCase(a.name, b.name);
	}
	if (a.price && b.price && a.price !== b.price) {
		return Coins.compare(a.price, b.price);
	}
	return asStringIgnoreCase(a.name, b.name);
}

//#endregion


export interface GearCore extends BulkCore<"Gear">, IHasContents {
	category: string;
	hands: string;
	level: number;
	price: string;
	quantity: number;
}

export class Gear extends HasBulk<GearCore, Gear> {
	// #region IHasName
	private _name?: string;
	public get name(): string {
		if (this._name === undefined) {
			this._name = this.category ? `${this.category.name} (${this.core.name})` : this.core.name;
		}
		return this._name;
	}
	// #endregion IHasName

	//#region IHasDetails
	private gearDetails?: TDetail[];
	public get details(): TDetail[] {
		if (!this.gearDetails) {
			this.gearDetails = this.parent?.details.slice()
				?? this.category?.details.slice()
				?? [];
			if (Array.isArray(this.core.details)) {
				this.gearDetails.push(...this.core.details);
			}
		}
		return this.gearDetails;
	}
	//#endregion

	//#region properties

	private _category?: GearCategory | null;
	public get category(): GearCategory | undefined {
		if (this._category === undefined) {
			this._category = findByValue("GearCategory", this.core.category) ?? null;
		}
		return this._category ?? undefined;
	}

	public get hands(): string | undefined { return this.core.hands; }
	public get isCraftersBook(): boolean { return this.name.match(/\bCrafter.s Book\b/) !== null; }
	public get isFormulaBook(): boolean { return this.name.match(/\bFormula Book\b/) !== null; }
	public get isSheath(): boolean { return this.name.match(/\bSheath\b/) !== null; }
	public get isSpellbook(): boolean { return this.name.match(/\bSpellbook\b/) !== null; }
	public get level(): number { return this.core.level || 0; }
	public get price(): string | undefined { return this.core.price; }
	public get quantity(): number { return this.core.quantity || 1; }

	//#endregion

	public toRenderableContent(): RenderableContent {
		const content = new Pf2eRenderableContent(this);

		const rarityAndLevelValues: string[] = [];
		if (this.rarity !== COMMON) {
			rarityAndLevelValues.push(this.rarity);
		}
		if (this.level) {
			rarityAndLevelValues.push(`level ${this.level}`);
		}
		const rarityAndLevel = rarityAndLevelValues.length ? ` (${rarityAndLevelValues.join(", ")})` : ``;
		const title = `<b>${this.name}</b>${rarityAndLevel}`;
		content.setTitle(title);

		content.append(`<b>Price</b> ${this.price || MDASH}`);
		content.append(this.toRenderableBulkString());
		content.append(`<b>Hands</b> ${this.hands || MDASH}`);

		this.appendDetailsTo(content);

		if (this.hasContents) {
			content.appendTitledSection(`<b>Contents</b>`, contentsToString(...this.contents));
		}

		return content;
	}

	//#region ISearchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			const terms: string[] = [];
			if (this.category) {
				terms.push(this.category.name);
			}
			if (this.isContainer) {
				terms.push("Container");
			}
			if (this.price) {
				terms.push(this.price);
			}
			score.append(searchInfo.score(this, terms));
		}
		return score;
	}

	//#endregion

	//#region static

	/** Represents the plural form of the objectType */
	public static get plural(): string {
		return this.singular;
	}

	//#endregion

}
