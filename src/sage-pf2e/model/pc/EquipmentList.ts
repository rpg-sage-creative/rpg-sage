import { randomUuid } from "@rsc-utils/uuid-utils";
import { HasIdCore, type IdCore } from "../../../sage-utils/utils/ClassUtils";
import { Bulk } from "../Bulk";
import { Coins } from "../Coins";
import type { NamedCore } from "../base/interfaces";
import type { Equipment } from "./Equipment";
import type { EquipmentItem } from "./EquipmentItem";

export interface EquipmentListCore extends IdCore<"EquipmentList">, NamedCore { }

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
		this.eq.addItemTo(this.id, ...items);
	}
	public empty(): void {
		this.eq.moveItemToList(this.eq.carried.id, ...this.items);
	}
	public remove(): void {
		this.eq.removeList(this.id);
	}
	public removeAll(): void {
		this.eq.removeItem(...this.items);
	}

	/**************************************************************************************************************************/
	// Static Methods

	public static createCore(name: string): EquipmentListCore {
		return {
			id: randomUuid(),
			name: name,
			objectType: "EquipmentList"
		};
	}

}
