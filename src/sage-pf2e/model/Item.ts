import type { IPoison, TAction } from "./../common.js";
import { HasSource, type SourcedCore } from "./base/HasSource.js";

export interface ItemCore extends SourcedCore<"Item"> {
	level: number;
	price: string;
	methodOfUse: string;
	bulk: string;
	actionType: TAction;
	activation: string;
	poison?: IPoison;
}

export class Item extends HasSource<ItemCore, "Item"> {

	public get level(): number { return this.core.level; }
}
