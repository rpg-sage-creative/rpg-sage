import utils from "../../sage-utils";
import * as Repository from "../data/Repository";
import type Ancestry from "./Ancestry";
import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";
import type { FeatureCore } from "./Feature";
import type { FeatureLevelCore } from "./Features";
import Features from "./Features";

export interface BackgroundCore extends SourcedCore<"Background"> {
	ancestry?: string;
	region?: string;
	features: FeatureCore[];
}

export default class Background extends HasSource<BackgroundCore> {
	// #region Constructor
	// public constructor(core: IBackground) {
	// 	super(core);
	// }
	// #endregion

	// #region Instance Properties
	private _ancestry?: Ancestry | null;
	public get ancestry(): Ancestry | undefined {
		if (this._ancestry === undefined) {
			this._ancestry = Repository.findByValue("Ancestry", this.core.ancestry) ?? null;
		}
		return this._ancestry ?? undefined;
	}

	private _features?: Features;
	public get features(): Features {
		return this._features ?? (this._features = new Features([{ level: 1, features: this.core.features }]));
	}

	public get region(): string | undefined {
		return this.core.region;
	}

	// private _skillFeat: Feat;
	// public get skillFeat(): Feat {
	// }

	// private _skills: Skill[];
	// public get skills(): Skill[] {
	// }
	// #endregion

	// #region utils.SearchUtils.ISearchable
	public get searchResultCategory(): string {
		const region = this.region ? `(${this.region})` : ``;
		const rarity = this.isNotCommon ? ` [${this.rarity}]` : ``;
		return `Background ${region} ${rarity}`;
	}
	// #endregion utils.SearchUtils.ISearchable

	// #region static

	public static FeatName = "Background Feat";
	public static FeatureObjectType = "BackgroundFeature";

	public static removeFeatures(features: FeatureCore[]): FeatureCore[] {
		return utils.ArrayUtils.Collection.remove(features, feature => feature.objectType === Background.FeatureObjectType);
	}

	public static replaceFeatures(level: FeatureLevelCore, background?: Background): void {
		Background.removeFeatures(level.features);
		if (background) {
			level.features.push(...background.features.get(level.level).map(feature => feature.toJSON()));
		}
	}
	// #endregion

}
