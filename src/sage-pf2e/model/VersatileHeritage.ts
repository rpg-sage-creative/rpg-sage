import type { RenderableContent as UtilsRenderableContent } from "@rsc-utils/core-utils";
import { RenderableContent } from "../data/RenderableContent.js";
import { HasSource, type SourcedCore } from "./base/HasSource.js";

export interface VersatileHeritageCore extends SourcedCore<"VersatileHeritage"> {
	// features: FeatureCore[];

	youMight: string[];
	othersProbably: string[];
}

function toList(items: string[]): string {
	const listItems = items.map(s => `<li>${s}</li>`);
	return `<ul>${listItems.join("")}</ul>`;
}

export class VersatileHeritage extends HasSource<VersatileHeritageCore> {

	//#region properties

	// public features = new Features([{ level:1, features:this.core.features }]);

	//#endregion

	//#region Renderable

	public toRenderableContent(): UtilsRenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b> (Versatile Heritage)`);
		this.appendDescriptionTo(renderable);
		this.appendDetailsTo(renderable);
		renderable.appendTitledSection("<b>You Might...</b>", toList(this.core.youMight));
		renderable.appendTitledSection("<b>Others Probably...</b>", toList(this.core.othersProbably));
		return renderable;
	}

	//#endregion

	//#region static

	// public static FeatureObjectType = "VersatileHeritageFeature";

	// public static removeFeatures(features: FeatureCore[]): FeatureCore[] {
	// 	return remove(features, feature => feature.objectType === VersatileHeritage.FeatureObjectType);
	// }
	// public static replaceFeatures(level: FeatureLevelCore, versatileHeritage: VersatileHeritage): void {
	// 	VersatileHeritage.removeFeatures(level.features);
	// 	level.features.push(...versatileHeritage.features.get(level.level).map(feature => feature.toJSON()));
	// }

	//#endregion

}
