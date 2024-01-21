import type { SearchInfo, SearchScore } from "@rsc-utils/search-utils";
import type { TQuality } from "../common";
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from "./base/HasSource";

/**************************************************************************************************************************/
// Interfaces and Class

export interface IMaterialCost {
	priceLightBulk: string;
	pricePerBulk: string;
	quality: TQuality;
}

export interface IMaterialHardness {
	expert: number;
	legendary: number;
	master: number;
	thickness: "Thin Item" | "Item" | "Structure";
}

export interface MaterialCore extends SourcedCore<"Material"> {
	cost: IMaterialCost[];
	hardness: IMaterialHardness[];
	requirements: string[];
}

export class Material extends HasSource<MaterialCore> {
	/**************************************************************************************************************************/
	// Properties

	public get cost(): IMaterialCost[] { return this.core.cost; }
	public get hardness(): IMaterialHardness[] { return this.core.hardness; }
	public get requirements(): string[] { return this.core.requirements; }

	/**************************************************************************************************************************/
	// Searchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.cost.map(cost => cost.quality), this.rarity, this.requirements, this.traits));
		}
		return score;
	}
}
