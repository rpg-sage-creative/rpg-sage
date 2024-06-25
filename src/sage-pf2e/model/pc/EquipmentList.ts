import { HasIdCore, type IdCore } from "@rsc-utils/class-utils";
import { randomSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { Bulk } from "../Bulk.js";
import { Coins } from "../Coins.js";
import type { NamedCore } from "../base/interfaces.js";
import type { Equipment } from "./Equipment.js";
import type { EquipmentItem } from "./EquipmentItem.js";

export interface EquipmentListCore extends IdCore<"EquipmentList", Snowflake>, NamedCore { }

export class EquipmentList extends HasIdCore<EquipmentListCore, "EquipmentList"> {

	public constructor(private eq: Equipment, core: EquipmentListCore) {
		super(core);
	}

	/**************************************************************************************************************************/
	// Properties

	public get bulk(): Bulk { return Bulk.from(...this.items.map(item => item.bulk)); }
	public get containers(): EquipmentItem[] { return this.items.filter(item => item.isContainer); }
	public get items(): EquipmentItem[] { return this.eq.items.filter(item => item.listId === this.core.id); }
	public get name(): string { return this.core.name; }
	public set name(name: string) { this.core.name = name; }
	public get sheaths(): EquipmentItem[] { return this.items.filter(item => item.isSheath); }
	public get value(): Coins { return Coins.sum(...this.items.map(item => item.value)); }

	/**************************************************************************************************************************/
	// Instance Methods

	public addItem(...items: EquipmentItem[]): void {
		this.eq.addItemTo(this.id as Snowflake, ...items);
	}
	public empty(): void {
		this.eq.moveItemToList(this.eq.carried.id as Snowflake, ...this.items);
	}
	public remove(): void {
		this.eq.removeList(this.id as Snowflake);
	}
	public removeAll(): void {
		this.eq.removeItem(...this.items);
	}

	/**************************************************************************************************************************/
	// Static Methods

	public static createCore(name: string): EquipmentListCore {
		return {
			id: randomSnowflake(),
			name: name,
			objectType: "EquipmentList"
		};
	}

}
