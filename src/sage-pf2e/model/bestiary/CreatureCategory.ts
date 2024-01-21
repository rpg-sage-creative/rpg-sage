import type { ISourceReference } from "../../common";
import { findByValue } from "../../data/Repository";
import type { BaseCore } from "../base/Base";
import type { SourcedCore } from "../base/HasSource";
import { HasSource } from "../base/HasSource";
import type { Item } from "../Item";
import type { ItemCore } from "../Item";
import type { Creature } from "./Creature";
import type { ICreature } from "./ICreature";

export interface IHasLevelAndName { level: number; name: string; }
export function sortByLevelThenName(a: IHasLevelAndName, b: IHasLevelAndName): number {
	const al = a.level,
		bl = b.level;
	if (al !== bl) {
		return al < bl ? -1 : 1;
	}
	const an = a.name,
		bn = b.name;
	if (an === bn) {
		return 0;
	}
	return an < bn ? -1 : 1;
}

/**************************************************************************************************************************/
// Interface and Class

export interface CreatureCategoryCore extends SourcedCore<"CreatureCategory"> {
	reference: ISourceReference;
	creatures: ICreature[];
	items: ItemCore[];
}

export class CreatureCategory extends HasSource<CreatureCategoryCore, "CreatureCategory"> {

	/**************************************************************************************************************************/
	// Properties

	private _creatures?: Creature[];
	public get creatures(): Creature[] {
		if (!this._creatures) {
			this._creatures = this.core.creatures
				.map(creature => findByValue("Creature", creature.name)!)
				.sort(sortByLevelThenName);
		}
		return this._creatures;
	}

	private _items?: Item[];
	public get items(): Item[] {
		if (!this._items) {
			this._items = this.core.items
				.map(item => findByValue("Item", item.name)!)
				.sort(sortByLevelThenName);
		}
		return this._items;
	}

	public get reference(): ISourceReference { return this.core.reference; }

	/**************************************************************************************************************************/
	// Instance Methods

	// public toJQuery(): Promise<JQuery> {
	// 	return new Promise<JQuery>(async resolve => {
	// 		let el = await super.toJQuery();
	// 		el.find("div.creature").each((i, elem) => {
	// 			$(elem).attr("data-parent-id", this.id).attr("id", this.creatures[i].id);
	// 		});
	// 		resolve(el);
	// 	});
	// }

	/**************************************************************************************************************************/
	// Searchable

	// public search(searchInfo: SearchInfo): SearchScore {
	// 	let score = super.search(searchInfo);
	// 	if (searchInfo.globalFlag) {
	// 		score.append(searchInfo.score(this.description, this.details));
	// 	}
	// 	return score;
	// }

	/**************************************************************************************************************************/
	// Static Methods

	// public static toListHtml(): string {
	// 	let html = ``;
	// 	Repository.all("CreatureCategory").forEach(category => {
	// 		html += `<div class="list-group">`;
	// 		html += `<div class="list-group-category list-group-category-halfmug">`;
	// 		html += `<span class="float-right glyphicons glyphicons-more-windows" onclick="$(this).closest('.list-group').next().toggle();"></span>`;
	// 		html += `<a href="#${category.id}" data-action="show-right" data-type="creature-category" data-id="${category.id}">${category.name}</a>`;
	// 		html += "</div>";
	// 		html += "</div>";
	// 		html += `<div class="list-group" style="display:none;">`;
	// 		category.creatures.forEach(creature => html += creature.toListItemHtml());
	// 		html += "</div>";
	// 	});
	// 	return html;
	// }
	// public static toJQuery(): Promise<JQuery> {
	// 	return new Promise<JQuery>(async resolve => {
	// 		let el = $(`<div class="creature-category-list"/>`),
	// 			categories = Repository.all("CreatureCategory");
	// 		for (let category of categories) {
	// 			el.append(await category.toJQuery());
	// 		}
	// 		resolve(el);
	// 	});
	// }

	public static childParser = (core: BaseCore) => ((core as CreatureCategoryCore).creatures as BaseCore[] ?? []).concat((core as CreatureCategoryCore).items as BaseCore[] ?? []);
}
