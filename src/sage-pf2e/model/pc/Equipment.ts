import { warn } from "@rsc-utils/core-utils";
import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import { DEXTERITY, STRENGTH } from "../../common.js";
import { AlchemicalItem } from "../AlchemicalItem.js";
import { Bulk } from "../Bulk.js";
import { Coins } from "../Coins.js";
import { Weapon } from "../Weapon.js";
import type { HasSource } from "../base/HasSource.js";
import { Check } from "./Check.js";
import type { EquipmentItemCore } from "./EquipmentItem.js";
import { EquipmentItem } from "./EquipmentItem.js";
import type { EquipmentListCore } from "./EquipmentList.js";
import { EquipmentList } from "./EquipmentList.js";
import type { PlayerCharacter } from "./PlayerCharacter.js";

type TFilter<T> = (value: T, index: number, array: T[]) => unknown;
type TIterator<T> = (value: T, index: number, array: T[]) => void;
type TFilteredIterator<T> = (value: T, index: number) => void;

export interface IEquipment {
	carriedList: EquipmentListCore;
	droppedList: EquipmentListCore;
	equippedList: EquipmentListCore;
	items: EquipmentItemCore[];
	otherLists: EquipmentListCore[];
	shoppingList: EquipmentListCore;
	wornList: EquipmentListCore;
}

export class Equipment {
	/**************************************************************************************************************************/
	// Constructor

	public constructor(private pc: PlayerCharacter, private core: IEquipment) {
		if (!core.carriedList) {
			core.carriedList = EquipmentList.createCore("Carried");
		}
		if (!core.droppedList) {
			core.droppedList = EquipmentList.createCore("Dropped");
		}
		if (!core.equippedList) {
			core.equippedList = EquipmentList.createCore("Equipped");
		}
		if (!core.items) {
			core.items = [];
		}
		if (!core.otherLists) {
			core.otherLists = [];
		}
		if (!core.shoppingList) {
			core.shoppingList = EquipmentList.createCore("Shopping Cart");
		}
		if (!core.wornList) {
			core.wornList = EquipmentList.createCore("Worn");
		}

		this.carried = new EquipmentList(this, core.carriedList);
		this.dropped = new EquipmentList(this, core.droppedList);
		this.equipped = new EquipmentList(this, core.equippedList);
		this.shoppingCart = new EquipmentList(this, core.shoppingList);
		this.worn = new EquipmentList(this, core.wornList);

		this.items.forEach(item => {
			if (item.containerId && !item.container) {
				warn("Invalid Container: " + item.name);
				item.containerId = undefined!;
				pc.save();
			}
			if (!item.containerId && !item.listId) {
				warn("No Container nor List: " + item.name);
				item.listId = this.dropped.id as Snowflake;
				pc.save();
			}
		});
	}

	/**************************************************************************************************************************/
	// Properties

	public get armor(): EquipmentItem | undefined {
		return this.equipped.items.find(item => item.item.objectType === "Armor");
	}
	public get bulk(): Bulk {
		return Bulk.from(this.carried.bulk, this.equipped.bulk, this.worn.bulk);
	}
	public carried: EquipmentList;
	public get containers(): EquipmentItem[] {
		return this.items.filter(item => item.isContainer && item.list !== this.shoppingCart);
	}
	public dropped: EquipmentList;
	public equipped: EquipmentList;
	public get items(): EquipmentItem[] {
		return this.core.items.map(item => new EquipmentItem(this, item));
	}
	public get lists(): EquipmentList[] {
		return [this.carried, this.equipped, this.worn, this.dropped].concat(this.otherLists);
	}
	public get otherLists(): EquipmentList[] {
		return this.core.otherLists.map(list => new EquipmentList(this, list));
	}
	public get raisedShield(): EquipmentItem | undefined {
		return this.equipped.items.find(item => item.item.objectType === "Shield" && item.isRaised);
	}
	public get sheaths(): EquipmentItem[] {
		return this.items.filter(item => item.isSheath && item.list !== this.shoppingCart);
	}
	public get shield(): EquipmentItem | undefined {
		return this.equipped.items.find(item => item.item.objectType === "Shield");
	}
	public shoppingCart: EquipmentList;
	public get value(): Coins {
		return Coins.sum(...this.items.filter(item => item.list !== this.shoppingCart).map(item => item.value));
	}
	public worn: EquipmentList;

	/**************************************************************************************************************************/
	// Instance Methods

	public clean(): void {
		// clear any cache
	}
	public update(): void {
		this.pc.update();
	}

	/**************************************************************************************************************************/
	// Item Instance Methods

	public addItemFrom<T extends HasSource>(item: T, name?: string): void {
		const core = EquipmentItem.createCore(item, name!),
			eqItem = new EquipmentItem(this, core);
		this.addItem(eqItem);
	}
	public addItem(...items: EquipmentItem[]): void {
		const coreItems = this.core.items;
		items.forEach(item => {
			if (!item.listId && !item.containerId) {
				item.listId = this.core.carriedList.id as Snowflake;
			}
			const core = item.toJSON();
			if (!coreItems.includes(core)) {
				coreItems.push(core);
			}
		});
		this.update();
	}
	public addItemTo(listId: Snowflake | UUID, ...items: EquipmentItem[]): void {
		items.forEach(item => {
			delete item.containerId;
			item.listId = listId as Snowflake;
		});
		this.addItem(...items);
	}
	public createItem(core: EquipmentItemCore): EquipmentItem {
		return new EquipmentItem(this, core);
	}
	public empty(): void {
		this.core.items.length = 0;
		this.update();
	}
	public filterItems<T extends EquipmentItem>(filter: TFilter<T>): T[] {
		return <T[]>this.items.filter(<TFilter<EquipmentItem>>filter);
	}
	public findItem<T extends EquipmentItem>(filter: TFilter<T>): T {
		return <T>this.items.find(<TFilter<EquipmentItem>>filter);
	}
	/** Iterates through all the items this contains. */
	public forEach<T extends EquipmentItem>(iterator: TIterator<T>): void;
	/** Iterates through a filtered subset of the items this contains. */
	public forEach<T extends EquipmentItem>(filter: TFilter<T>, iterator: TFilteredIterator<T>): void;
	public forEach<T extends EquipmentItem>(...args: (TIterator<T> | TFilteredIterator<T> | TFilter<T>)[]): void {
		const iterator = args.pop(),
			filter = args.pop();
		if (filter) {
			(this.items as T[]).filter(filter, this).forEach(iterator as TIterator<T>, this);
		}else {
			(this.items as T[]).forEach(iterator as TIterator<T>, this);
		}
	}
	public getCheck(eqItem: EquipmentItem): Check {
		const item = eqItem.item,
			check = new Check(this.pc, item.name);
		if (item instanceof Weapon) {
			if (item.type === "Melee") {
				warn("Weapon Check: Which Stat?");
				check.setAbility(STRENGTH);
			}
			if (item.type === "Ranged") {
				check.setAbility(DEXTERITY);
			}
			check.addProficiency(item.category + " Weapons");
			if (eqItem.meta?.potencyRuneValue) {
				check.addItemModifier("Potency Rune", eqItem.meta.potencyRuneValue);
			}
		}
		if (item instanceof AlchemicalItem) {
			check.setAbility(DEXTERITY);
			check.addProficiency("Alchemical Bombs");
		}
		return check;
	}
	public getItem(itemId: Snowflake | UUID): EquipmentItem | undefined {
		return this.items.find(item => item.id === itemId);
	}
	public moveItemToContainer(containerId: Snowflake | UUID, ...items: EquipmentItem[]): void {
		items.forEach(item => {
			item.containerId = containerId as Snowflake;
			delete item.listId;
		});
		this.update();
	}
	public moveItemToList(listId: Snowflake | UUID, ...items: EquipmentItem[]): void {
		items.forEach(item => item.listId = listId as Snowflake);
		this.update();
	}
	public removeItem(...items: EquipmentItem[]): void {
		const coreItems = this.core.items;
		items.forEach(item => {
			const core = item.toJSON();
			if (coreItems.includes(core)) {
				coreItems.splice(coreItems.indexOf(core), 1);
			}
		});
		this.update();
	}
	// public transferItem(...items: EquipmentItem[]): void {
	// 	let coreItems = this.core.items,
	// 		listIds = this.lists.map(list => list.id);
	// 	items.forEach(item => {
	// 		let containerId = item.containerId;
	// 		if (containerId && !coreItems.find(item => item.id === containerId)) {
	// 			item.containerId = null;
	// 		}
	// 		let listId = item.listId;
	// 		if (listId && !listIds.includes(listId)) {
	// 			item.listId = EQUIPMENT_LIST_CARRIED_ID;
	// 		}
	// 		if (!equipmentItems.includes(item.toJSON())) {
	// 			item.remove();
	// 			equipmentItems.push(item.toJSON());
	// 		}
	// 	});
	// 	this.update();
	// }

	/**************************************************************************************************************************/
	// List Instance Methods

	public addList(name: string): EquipmentList {
		const core = EquipmentList.createCore(name);
		this.core.otherLists.push(core);
		this.update();
		return this.getList(core.id as Snowflake)!;
	}
	public canRemoveList(listId: Snowflake | UUID): boolean {
		return this.core.otherLists.find(list => list.id === listId) !== undefined;
	}
	public getList(listId: Snowflake | UUID): EquipmentList | undefined {
		return this.lists.find(list => list.id === listId);
	}
	public renameList(listId: Snowflake | UUID, name: string): void {
		const list = this.getList(listId);
		if (list) {
			list.name = name;
			this.update();
		}
	}
	public removeList(listId: Snowflake | UUID): void {
		if (this.canRemoveList(listId)) {
			const lists = this.core.otherLists,
				list = this.getList(listId)!,
				listCore = list.toJSON(),
				carriedListId = this.carried.id as Snowflake;
			list.items.forEach(item => item.listId = carriedListId);
			lists.splice(lists.indexOf(listCore), 1);
			this.update();
		}
	}
}
