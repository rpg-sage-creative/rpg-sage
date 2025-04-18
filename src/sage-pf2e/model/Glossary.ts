import type { SearchInfo, SearchScore } from "@rsc-utils/core-utils";
import { HasSource, type SourcedCore } from "./base/HasSource.js";

export interface GlossaryCore extends SourcedCore<"Glossary"> {
	abbrev: string;
}

export class Glossary extends HasSource<GlossaryCore> {

	public get abbrev(): string { return this.core.abbrev || ""; }

	//#region Searchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.abbrev));
		}
		return score;
	}

	//#endregion

	//#region static

	/** Represents the plural form of the objectType */
	public static get plural(): string {
		return this.singular;
	}

	//#endregion
}
