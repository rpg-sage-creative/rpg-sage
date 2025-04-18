import type { RenderableContent as UtilsRenderableContent } from "@rsc-utils/core-utils";
import type { SearchInfo, SearchScore } from "@rsc-utils/search-utils";
import { RenderableContent } from "../data/RenderableContent.js";
import { Feature } from "./Feature.js";
import type { SourcedCore } from "./base/HasSource.js";
import { HasSource } from "./base/HasSource.js";

export interface LanguageCore extends SourcedCore<"Language"> {
	speakers: string[];
}

export class Language extends HasSource<LanguageCore> {

	public get speakers(): string[] { return this.core.speakers || []; }

	//#region Searchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.speakers));
		}
		return score;
	}

	public toRenderableContent(): UtilsRenderableContent {
		const content = new RenderableContent(this);
		content.setTitle(`<b>${this.name}</b> (Language)`);
		content.append(`<b>Rarity</b> ${this.rarity}`);
		content.append(`<b>Speakers</b> ${this.speakers.join(", ")}`);

		return content;
	}

	public toAonLink(): string {
		return super.toAonLink(`${this.name} Language`);
	}

	//#endregion

	//#region static

	public static FeatureObjectType = "LanguageFeature";
	public static LanguagesName = "Languages";

	public static createFeature(level: number, languages: string[], source = "PZO2101"): Feature {
		return new Feature({
			id: undefined!, /*//TODO: temp feature no ID*/
			objectType: <"Feature">Language.FeatureObjectType,
			level: level,
			name: Language.LanguagesName,
			metadata: {
				languages: [
					{
						given: languages
					}
				]
			},
			source: source,
			traits: []
		});
	}

	//#endregion
}
