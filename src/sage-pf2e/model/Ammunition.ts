import type utils from "../../sage-utils";
import { MDASH, NEWLINE, TAB } from "../common";
import RenderableContent from "../data/RenderableContent";
import { filter } from "../data/Repository";
import type { BulkCore } from "./HasBulk";
import HasBulk from "./HasBulk";
import type Weapon from "./Weapon";

export interface AmmunitionCore extends BulkCore<"Ammunition"> {
	quantity: number;
	price: string;
}

export default class Ammunition extends HasBulk<AmmunitionCore, Ammunition>{

	/**************************************************************************************************************************/
	// Properties

	public get price(): string | undefined { return this.core.price ?? undefined; }
	public get quantity(): number { return this.core.quantity || 1; } /*// use the || to ensure "" or 0 becomes 1*/

	private _weapons?: Weapon[];
	public get weapons(): Weapon[] {
		if (!this._weapons) {
			this._weapons = filter("Weapon", weapon => weapon.ammunition === this);
		}
		return this._weapons;
	}

	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const content = new RenderableContent(this);
		content.setTitle(`<b>${this.name}</b> (Ammunition)`);
		content.append(`<b>Quantity</b> ${this.quantity}; <b>Price</b> ${this.price || MDASH}; ${this.toRenderableBulkString()}`);
		content.append(...this.details.map((d, i) => (i ? TAB : NEWLINE) + d));
		content.appendTitledSection("<b>Weapons</b>", this.weapons.join(", "));
		return content;
	}

	/**************************************************************************************************************************/
	// utils.SearchUtils.ISearchable

	public search(searchInfo: utils.SearchUtils.SearchInfo): utils.SearchUtils.SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			const terms: string[] = [];
			if (this.price) {
				terms.push(this.price);
			}
			score.append(searchInfo.score(this, terms));
		}
		return score;
	}

	//#region static

	/** Reprents the objectType in Archives of Nethys */
	public static get aon(): string {
		return "Weapons";
	}

	/** Represents the plural form of the objectType */
	public static get plural(): string {
		return this.singular;
	}

	//#endregion

}
