import type { RenderableContent } from "../../sage-utils/RenderUtils";
import type { SearchInfo, SearchScore } from "../../sage-utils/SearchUtils";
import { Pf2eRenderableContent } from "../Pf2eRenderableContent";
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from "./base/HasSource";
import { Feature } from "./Feature";

export interface LanguageCore extends SourcedCore<"Language"> {
	speakers: string[];
}

export class Language extends HasSource<LanguageCore> {

	public get speakers(): string[] { return this.core.speakers || []; }

	//#region ISearchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.speakers));
		}
		return score;
	}

	public toRenderableContent(): RenderableContent {
		const content = new Pf2eRenderableContent(this);
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
