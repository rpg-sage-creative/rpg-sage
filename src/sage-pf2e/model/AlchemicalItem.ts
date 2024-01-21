import type { SearchInfo, SearchScore } from "@rsc-utils/search-utils";
import type { BulkCore } from "./HasBulk";
import { HasBulk } from "./HasBulk";

/**************************************************************************************************************************/
// Interface and Class

export interface AlchemicalItemCore extends BulkCore<"AlchemicalItem"> {
	level: number;
	price: string;
}

export class AlchemicalItem extends HasBulk<AlchemicalItemCore, AlchemicalItem> {

	/**************************************************************************************************************************/
	// Constructor

	public constructor(core: AlchemicalItemCore) {
		super(core);
		this.isEquippable = this.traits.includes("Bomb");
	}

	/**************************************************************************************************************************/
	// Properties

	public get level(): number { return this.core.level || 0; }
	public get price(): string | undefined { return this.core.price ?? undefined; }

	/**************************************************************************************************************************/
	// Searchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			const terms: string[] = [];
			if (this.price) {
				terms.push(this.price);
			}
			terms.push(...this.traits);

			score.append(searchInfo.score(this, terms));
		}
		return score;

	}
}
