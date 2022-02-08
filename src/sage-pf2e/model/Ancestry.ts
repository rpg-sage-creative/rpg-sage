import utils from "../../sage-utils";
import RenderableContent from "../data/RenderableContent";
import * as Repository from "../data/Repository";
import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";
import type { FeatureCore } from "./Feature";
import Feature from "./Feature";
import Features from "./Features";
import type Heritage from "./Heritage";

export interface AncestryCore extends SourcedCore<"Ancestry"> {
	// adventurers: string[];
	features: FeatureCore[];
	ancestryFeats: number[];

	youMight: string[];
	othersProbably: string[];
}

function toUl(items: string[]): string {
	const listItems = items.map(item => `<li>${item}</li>`);
	return `<ul>${listItems}</ul>`;
}

export default class Ancestry extends HasSource<AncestryCore> {

	//#region properties

	// public get adventurers(): string[] { return this.core.adventurers || []; }
	public features = new Features([{ level: 1, features: this.core.features ?? [] }]);
	public get heritages(): Heritage[] { return Repository.filter("Heritage", h => h.ancestry === this); }

	//#endregion

	//#region instance methods

	public getAncestryFeats(level: number): Feature[] {
		if (this.core.ancestryFeats.includes(level)) {
			return [Ancestry.createFeat(level, Ancestry.AncestryFeatName, this.name)];
		}
		return [];
	}

	//#endregion

	//#region utils.RenderUtils.IRenderable

	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b> (${this.objectType})`);
		if (this.hasTraits || this.isNotCommon) {
			const traits: string[] = [];
			if (this.isNotCommon) {
				traits.push(this.rarity);
			}
			traits.push(...this.nonRarityTraits);
			renderable.append(traits.map(trait => `[${trait}]`).join(" "));
		}
		this.appendDescriptionTo(renderable);
		this.appendDetailsTo(renderable);
		renderable.appendTitledSection("<b>You Might...</b>", toUl(this.core.youMight));
		renderable.appendTitledSection("<b>Others Probably...</b>", toUl(this.core.othersProbably));
		renderable.appendTitledSection("Heritages", toUl(this.heritages.map(heritage => heritage.name)));
		// What was I thinking here? --> renderable.addAonLink(...this.heritages.map(heritage => heritage.toAonLink()));
		return renderable;
	}

	//#endregion

	//#region static

	public static AncestryFeatName = "Ancestry Feat";
	public static FeatureObjectType = "AncestryFeature";

	public static createFeat(level: number, name: string, trait: string): Feature {
		return new Feature({
			//TODO temp item so I don't need a UUID?
			id: undefined!,
			objectType: <"Feature">Ancestry.FeatureObjectType,
			level: level,
			name: name,
			metadata: {
				feat: {
					filterLevel: level,
					filterTrait: trait
				}
			},
			source: "PZO2100",
			traits: undefined
		});
	}

	public static removeFeatures(features: FeatureCore[]): FeatureCore[] {
		return utils.ArrayUtils.Collection.remove(features, feature => feature.objectType === Ancestry.FeatureObjectType);
	}

	//#endregion

}
