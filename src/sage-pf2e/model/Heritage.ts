import { remove, type RenderableContent as UtilsRenderableContent } from "@rsc-utils/core-utils";
import { RenderableContent } from "../data/RenderableContent.js";
import { findByValue } from "../data/Repository.js";
import { Ancestry } from "./Ancestry.js";
import type { FeatureCore } from "./Feature.js";
import { Features, type FeatureLevelCore } from "./Features.js";
import { HasSource, type SourcedCore } from "./base/HasSource.js";

export interface HeritageCore extends SourcedCore<"Heritage"> {
	ancestry: string;
	features: FeatureCore[];
}

export class Heritage extends HasSource<HeritageCore> {

	//#region properties

	public ancestry = findByValue("Ancestry", this.core.ancestry)!;
	public features = new Features([{ level: 1, features: this.core.features ?? [] }]);

	//#endregion

	//#region Renderable

	public toRenderableContent(): UtilsRenderableContent {
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
		return remove(features, feature => feature.objectType === Heritage.FeatureObjectType);
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
