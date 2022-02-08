import utils from "../../sage-utils";
import RenderableContent from "../data/RenderableContent";
import { findByValue } from "../data/Repository";
import Ancestry from "./Ancestry";
import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";
import type { FeatureCore } from "./Feature";
import type { FeatureLevelCore } from "./Features";
import Features from "./Features";

export interface HeritageCore extends SourcedCore<"Heritage"> {
	ancestry: string;
	features: FeatureCore[];
}

export default class Heritage extends HasSource<HeritageCore> {

	//#region properties

	public ancestry = findByValue("Ancestry", this.core.ancestry)!;
	public features = new Features([{ level: 1, features: this.core.features ?? [] }]);

	//#endregion

	//#region utils.RenderUtils.IRenderable

	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b> (${this.objectType})`);
		this.appendDescriptionTo(renderable);
		this.appendDetailsTo(renderable);
		renderable.addAonLink(this.ancestry.toAonLink());
		return renderable;
	}

	//#endregion

	//#region static

	public static FeatureObjectType = "HeritageFeature";

	public static removeFeatures(features: FeatureCore[]): FeatureCore[] {
		return utils.ArrayUtils.Collection.remove(features, feature => feature.objectType === Heritage.FeatureObjectType);
	}
	public static replaceFeatures(level: FeatureLevelCore, heritage: Heritage): void {
		Ancestry.removeFeatures(level.features);
		Heritage.removeFeatures(level.features);
		if (!heritage) {
			return;
		}
		level.features.push(...heritage.ancestry.features.get(level.level).map(feature => feature.toJSON()));
		level.features.push(...heritage.features.get(level.level).map(feature => feature.toJSON()));
		level.features.push(...heritage.ancestry.getAncestryFeats(level.level).map(feature => feature.toJSON()));
	}

	//#endregion

}
