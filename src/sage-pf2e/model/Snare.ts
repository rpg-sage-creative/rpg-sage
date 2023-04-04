import type { SearchInfo, SearchScore } from "../../sage-utils/SearchUtils";
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from "./base/HasSource";

export interface SnareCore extends SourcedCore<"Snare"> {
	price: string;
	level: number;
	craftRequirements: string[];
}

export class Snare extends HasSource<SnareCore> {

	/**************************************************************************************************************************/
	// Properties

	public get price(): string { return this.core.price; }
	public get level(): number { return this.core.level; }
	public get craftRequirements(): string[] { return this.core.craftRequirements || []; }

	/**************************************************************************************************************************/
	// ISearchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.rarity, this.traits, this.craftRequirements));
		}
		return score;
	}
}
