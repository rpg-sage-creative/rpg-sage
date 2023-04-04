import type { SearchInfo, SearchScore } from "../../sage-utils/SearchUtils";
import { MDASH, NEWLINE, TAB, toModifier } from "../common";
import { Pf2eRenderableContent } from "../Pf2eRenderableContent";
import { filterBy, findByValue } from "../data";
import type { ArmorGroup } from "./ArmorGroup";
import type { BulkCore } from "./HasBulk";
import { HasBulk } from "./HasBulk";
import type { Trait } from "./Trait";
import type { RenderableContent } from "../../sage-utils/RenderUtils";

/*
// function sortGear(a: Gear, b: Gear): number {
// 	if (a.category != b.category) {
// 		return utils.ArrayUtils.Sort.asStringIgnoreCase(`${a.category || ""}${a.name}`, `${b.category || ""}${b.name}`);
// 	}
// 	if (!a.category) {
// 		return utils.ArrayUtils.Sort.asStringIgnoreCase(a.name, b.name);
// 	}
// 	if (a.price != b.price) {
// 		return rpg.SpUtils.parse(a.price) < rpg.SpUtils.parse(b.price) ? -1 : 1;
// 	}
// 	return utils.ArrayUtils.Sort.asStringIgnoreCase(a.name, b.name);
// }
*/

export interface ArmorCore extends BulkCore<"Armor"> {
	acBonus?: number;
	category: "Light" | "Medium" | "Heavy";/*// | "Shields";*/
	checkPenalty?: number;
	dexModCap?: number;
	group: "Leather" | "Composite" | "Chain" | "Plate";
	level?: number;
	price?: string;
	speedPenalty?: number;
	strength?: number;
}

export class Armor extends HasBulk<ArmorCore, Armor> {

	/**************************************************************************************************************************/
	// Properties

	public get acBonus(): number { return this.core.acBonus || 0; }
	public get category(): string { return this.core.category; }
	public get checkPenalty(): number | undefined { return this.core.checkPenalty; }
	public get dexModCap(): number | undefined { return this.core.dexModCap; }
	private _group?: ArmorGroup | null;
	public get group(): ArmorGroup | undefined {
		if (this._group === undefined) {
			this._group = findByValue("ArmorGroup", this.core.group) ?? null;
		}
		return this._group ?? undefined;
	}
	public isEquippable = true;
	public get level(): number { return this.core.level || 0; }
	public get price(): string | undefined { return this.core.price; }
	public get speedPenalty(): number | undefined { return this.core.speedPenalty; }
	public get strength(): number | undefined { return this.core.strength; }
	private _Traits?: Trait[];
	public get Traits(): Trait[] {
		if (!this._Traits) {
			const coreTraits = this.traits;
			this._Traits = filterBy("Trait", trait => coreTraits.includes(trait.name));
		}
		return this._Traits;
	}

	public hasTrait(traitName: string): boolean { return this.Traits.find(trait => trait.name === traitName) !== undefined; }

	public toRenderableContentCategoryGroup(content: RenderableContent): void {
		const catGroupTraits = [`<b>Category</b> ${this.category}`];
		if (this.group) {
			catGroupTraits.push(`<b>Group</b> ${this.group || MDASH}`);
		}
		catGroupTraits.push(`<b>Traits</b> ${this.nonRarityTraits.join(", ") || MDASH}`);
		content.append(catGroupTraits.join("; "));
	}
	public toRenderableContentStrengthGroupTraits(content: RenderableContent): void {
		if (this.strength) {
			content.appendTitledSection(`<b>Strength</b>`, `This entry indicates the Strength score at which you are strong enough to overcome some of the armor's penalties. If your Strength is equal to or greater than this value, you no longer take the armor's check penalty, and you decrease the Speed penalty by 5 feet (to no penalty if the penalty was –5 feet, or to a –5-foot penalty if the penalty was –10 feet).`);
		}
		if (this.group) {
			content.appendSections(this.group.toRenderableContentTitledSection());
		}
		this.Traits.forEach(trait => content.appendTitledSection(`<b>Trait</b> ${trait}`, ...trait.details.map((d, i) => (i ? TAB : NEWLINE) + d)));
	}
	public toRenderableContent(): RenderableContent {
		const content = new Pf2eRenderableContent(this);

		const level = this.level ? `(level ${this.level})` : ``;
		const title = `<b>${this.name}</b> ${level}`;
		content.setTitle(title);

		content.append(`<b>Price</b> ${this.price || MDASH}`);
		content.append(`<b>AC Bonus</b> ${toModifier(this.acBonus)}; <b>Dex Cap</b> ${this.dexModCap && toModifier(this.dexModCap) || MDASH}`);

		const checkSpeedStrength = [`<b>Check Penalty</b> ${this.checkPenalty && toModifier(this.checkPenalty) || MDASH}`];
		checkSpeedStrength.push(`<b>Speed Penalty</b> ${this.speedPenalty ? toModifier(this.speedPenalty) + " ft." : MDASH}`);
		if (this.strength) {
			checkSpeedStrength.push(`<b>Strength</b> ${this.strength}`);
		}
		content.append(checkSpeedStrength.join("; "));

		this.toRenderableContentCategoryGroup(content);

		content.append(this.toRenderableBulkString());

		content.append(...this.details.map((d, i) => (i ? TAB : NEWLINE) + d));

		this.toRenderableContentStrengthGroupTraits(content);

		return content;
	}

	/**************************************************************************************************************************/
	// ISearchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			const terms: string[] = [];
			if (this.category) {
				terms.push(this.category);
			}
			/*
			// if (this.isExpert) { terms.push("Expert"); }
			// if (this.isMaster) { terms.push("Master"); }
			*/
			if (this.price) {
				terms.push(this.price);
			}
			if (this.group) {
				terms.push(this.group.name);
			}
			terms.push(...this.Traits.map(trait => trait.name));
			score.append(searchInfo.score(this, terms));
		}
		return score;
	}

	/**************************************************************************************************************************/
	// Static Methods

	// public static toSelectHtml(): string {
	// 	let lastCategory: string,
	// 		html = ``;
	// 	Repository.all<Armor>("Armor").forEach(armor => {
	// 		if (lastCategory && armor.category != lastCategory) { html += `</optgroup>`; }
	// 		if (armor.category && armor.category != lastCategory) { html += `<optgroup label="${armor.category}">`; }
	// 		html += `<option value="${armor.id}">${armor.name} ${MDASH} AC ${armor.acBonus}, TAC ${armor.tacBonus}; ${armor.bulk} Bulk</option>`;
	// 		lastCategory = armor.category;
	// 	});
	// 	if (lastCategory) { html += `</optgroup>`; }
	// 	html += `<optgroup label="Shields">`;
	// 	Repository.all<Armor>("Shield").forEach(shield => html += `<option value="${shield.id}">${shield.name} ${MDASH} AC ${shield.acBonus}, TAC ${shield.tacBonus}; ${shield.bulk} Bulk</option>`);
	// 	html += `</optgroup>`;
	// 	return html;
	// }

	//#region static

	/** Represents the plural form of the objectType */
	public static get plural(): string {
		return this.singular;
	}

	//#endregion
}
