import { warn } from "@rsc-utils/console-utils";
import { randomUuid, type UUID } from "@rsc-utils/uuid-utils";
import utils from "../../../sage-utils";
import type { IdCore } from "../../../sage-utils/utils/ClassUtils";
import type { TQuality } from "../../common";
import { findById } from "../../data/Repository";
import Bulk from "../Bulk";
import Coins from "../Coins";
import type Gear from "../Gear";
import type HasBulk from "../HasBulk";
import type { BulkCore } from "../HasBulk";
import type { IMetadata } from "../Metadata";
import type Spell from "../Spell";
import type Base from "../base/Base";
import type HasSource from "../base/HasSource";
import type Equipment from "./Equipment";
import type EquipmentList from "./EquipmentList";

export interface EquipmentItemCore extends IdCore<"EquipmentItem"> {
	containerId?: UUID;
	count: number;
	entries?: string[];
	itemId: UUID;
	itemQuality: TQuality;
	isInvested: boolean;
	isRaised: boolean;
	listId?: UUID;
	name: string;
}

interface IHasTraits extends HasBulk<BulkCore, IHasTraits> {
	traits: string[];
}

type TEquipmentItemResolvable = EquipmentItem | UUID;

function toUuid(equipmentItemResolvable: TEquipmentItemResolvable): UUID {
	return typeof (equipmentItemResolvable) === "string" ? equipmentItemResolvable : equipmentItemResolvable.id;
}

export default class EquipmentItem extends utils.ClassUtils.HasIdCore<EquipmentItemCore> {

	public constructor(private eq: Equipment, core: EquipmentItemCore) {
		super(core);
		this.item = findById<HasBulk>(core.itemId)!;
	}

	//#region can Properties
	public get canCarry(): boolean { return !this.isEquipped && this.core.listId !== this.eq.carried.id; }
	public get canDrop(): boolean { return this.core.listId !== this.eq.dropped.id; }
	public get canEquip(): boolean { return this.isEquippable && this.core.listId !== this.eq.equipped.id; }
	public get canInvest(): boolean { return !this.isInvested && this.hasTrait("Invested"); }
	public get canRaise(): boolean { return !this.isRaised && this.isEquipped && this.item.objectType === "Shield"; }
	public get canSheath(): boolean { return this.item.objectType === "Weapon"; }
	public get canSplit(): boolean { return this.count > 1; }
	public get canWear(): boolean { return this.item.isWearable && !this.isEquippable && this.core.listId !== this.eq.worn.id; }
	public get canUnequip(): boolean { return this.isEquippable && this.core.listId === this.eq.equipped.id; }
	//#endregion

	//#region is Properties
	public get isBook(): boolean { return this.isCraftersBook || this.isFormulaBook || this.isSpellbook; }
	public get isCarried(): boolean { return this.core.listId === this.eq.carried.id; }
	public get isContainer(): boolean { return this.item.objectType === "Gear" && (<Gear>this.item).isContainer; }
	public get isCraftersBook(): boolean { return this.item.objectType === "Gear" && (<Gear>this.item).isCraftersBook; }
	public get isDropped(): boolean { return this.core.listId === this.eq.dropped.id; }
	public get isEquippable(): boolean { return this.item.isEquippable; }
	public get isEquipped(): boolean { return this.isEquippable && this.core.listId === this.eq.equipped.id; }
	public get isFormulaBook(): boolean { return this.item.objectType === "Gear" && (<Gear>this.item).isFormulaBook; }
	public get isInvested(): boolean { return this.core.isInvested; }
	public get isRaised(): boolean { return this.core.isRaised; }
	public get isSheath(): boolean { return this.item.objectType === "Gear" && (<Gear>this.item).isSheath; }
	public get isSpellbook(): boolean { return this.item.objectType === "Gear" && (<Gear>this.item).isSpellbook; }
	public get isWorn(): boolean { return !this.isEquippable && this.core.listId === this.eq.worn.id; }
	//#endregion

	//#region bulk properties
	public get bulk(): Bulk {
		const bulk = ((this.isEquipped || this.isWorn) && this.item.wornBulk || this.item.bulk).multiply(this.count);
		return (this.isContainer || this.isSheath) ? Bulk.from(bulk, this.carriedBulk!) : bulk;
	}
	public get carriedBulk(): Bulk | undefined { return (this.isContainer || this.isSheath) && Bulk.from(...this.items.map(item => item.bulk)) || undefined; }
	public get maxBulk(): Bulk | undefined { return this.isContainer && (<Gear>this.item).maxBulk || undefined; }
	//#endregion

	//#region other properties
	public get count(): number { return this.core.count; }
	public get entries(): string[] { return this.core.entries ?? []; }
	public set entries(entries: string[]) { this.core.entries = entries; }
	public item: HasBulk<BulkCore, any>;
	public get itemQuality(): TQuality { return this.core.itemQuality; }
	public get items(): EquipmentItem[] { return this.eq.items.filter(item => item.containerId === this.id); }
	public get meta(): IMetadata { return this.getMeta(); }
	public get name(): string { return this.core.name; }
	// public set name(name: string) { this.core.name = name; }
	public get value(): Coins { return Coins.parse((<any>this.item).price); }
	//#endregion

	//#region container properties
	public get container(): EquipmentItem | undefined {
		return this.core.containerId ? this.eq.getItem(this.core.containerId) : undefined;
	}
	public get containerId(): UUID | undefined {
		return this.core.containerId;
	}
	public set containerId(containerId: UUID | undefined) {
		this.core.containerId = containerId;
	}
	//#endregion

	//#region list properties
	public get list(): EquipmentList | undefined {
		if (this.core.containerId) {
			const container = this.container;
			if (!container) {
				warn(`item with containerid (${this.core.containerId}) but no container`);
			}else {
				const list = container.list;
				if (list) {
					return list;
				}
			}
		}
		if (this.core.listId) {
			return this.eq.getList(this.core.listId);
		}
		return undefined;
	}
	public get listId(): UUID | undefined {
		return this.core.listId;
	}
	public set listId(listId: UUID | undefined) {
		this.core.listId = listId;
	}
	//#endregion

	/**************************************************************************************************************************/
	// Private Instance Methods

	private getMeta(): IMetadata {
		const meta: Partial<IMetadata> = {};
		// for (let key in this.item.meta)
		return <IMetadata>meta;
	}

	/**************************************************************************************************************************/
	// Instance Methods

	public canAdd(itemId: string): boolean;
	public canAdd(item: EquipmentItem): boolean;
	public canAdd(itemOrId: string | EquipmentItem): boolean {
		const item = typeof (itemOrId) === "string" ? this.eq.getItem(itemOrId) : itemOrId;
		if (!item) {
			return false;
		}

		const isValidSheathOrContainer = this.checkSheathAndEnsureContainer(item);
		if (isValidSheathOrContainer !== undefined) {
			return isValidSheathOrContainer;
		}

		const isValidNest = this.checkNesting(item);
		if (isValidNest !== undefined) {
			return isValidNest;
		}

		const thisMaxBulk = this.maxBulk!,
			itemBulk = item.bulk;
		if (thisMaxBulk.wholeBulk < itemBulk.wholeBulk) {
			return false;
		}

		const containers = this.getContainerStack();

		for (let index = 0, length = containers.length, delta = 0; index < length; index++) {
			const container = containers[index];
			delta = container.includes(item, true) ? itemBulk.numberValue : 0;
			if (container.maxBulk!.numberValue < container.carriedBulk!.numberValue - delta + itemBulk.numberValue) {
				return false;
			}
		}
		return true;
	}
	/**
	 * Convenience for testing if sheath or not container.
	 * Return true if empty sheath and item is sheathable.
	 * Return false if not a container.
	 * Returns undefined if neither case exists.
	 */
	private checkSheathAndEnsureContainer(item: EquipmentItem): boolean | undefined {
		if (item.canSheath && this.isSheath && !this.items.length) {
			return true;
		}
		if (!this.isContainer) {
			return false;
		}
		return undefined;
	}
	/**
	 * Convenience for ensuring we don't put an item in an item it contains.
	 * Returns false if nesting creates recursion.
	 * Returns true if this item is already held by a child container.
	 * Returns undefined if neither case exists.
	 */
	private checkNesting(item: EquipmentItem): boolean | undefined {
		if (this.id === item.id || this.id === item.containerId) {
			return false;
		}
		if (this.includes(item) || item.includes(this.id, true)) {
			return false;
		}
		if (this.includes(item, true)) {
			return true;
		}
		return undefined;
	}
	/** Gets the stack of containers starting with 'this' item. */
	private getContainerStack(): EquipmentItem[] {
		const stack: EquipmentItem[] = [];
		let container: EquipmentItem | undefined = this;
		do {
			stack.push(container);
			container = container.container;
		} while (container);
		return stack;
	}
	public addEntry(entry: string): void;
	public addEntry(spell: Spell): void
	public addEntry(entryOrEntity: string | Base): void {
		const entry = typeof (entryOrEntity) === "string" ? entryOrEntity : entryOrEntity.name;
		if (!this.core.entries) {
			this.core.entries = [];
		}
		if (!this.core.entries.includes(entry)) {
			this.core.entries.push(entry);
		}
	}
	public canMerge(itemId: string): boolean {
		if (this.isContainer || this.isSheath) {
			return false;
		}
		const item = itemId ? this.eq.getItem(itemId) : undefined;
		return item ? EquipmentItem.canMerge(this, item) : false;
	}
	public carry(): void {
		delete this.core.containerId;
		this.core.listId = this.eq.carried.id;
		this.eq.update();
	}
	public drop(): void {
		delete this.core.containerId;
		this.core.isRaised = false;
		this.core.listId = this.eq.dropped.id;
		this.eq.update();
	}
	public empty(): void {
		this.items.forEach(item => {
			delete item.core.containerId;
			item.core.isRaised = false;
			item.core.listId = this.eq.dropped.id;
		});
		this.eq.update();
	}
	public equip(): void {
		let equipped: EquipmentItem | undefined;
		const containerId = this.containerId,
			listId = this.listId;
		if (this.item.objectType === "Armor") {
			equipped = this.eq.armor;
		}
		if (this.item.objectType === "Shield") {
			equipped = this.eq.shield;
		}
		delete this.core.containerId;
		this.core.listId = this.eq.equipped.id;
		if (equipped) {
			if (containerId) {
				if (this.eq.getItem(containerId)?.canAdd(equipped)) {
					equipped.containerId = containerId;
					delete equipped.listId;
				}
			} else {
				equipped.listId = listId ?? this.eq.carried.id;
			}
		}
		this.eq.update();
	}
	public hasTrait(trait: string): boolean {
		const traits = (<IHasTraits>this.item).traits;
		// This is hacked to allow an item with .traits, we must assume it may not exist.
		return traits?.includes(trait) === true;
	}
	public includes(itemId: UUID): boolean;
	public includes(itemId: UUID, deep?: boolean): boolean;
	public includes(item: EquipmentItem): boolean;
	public includes(item: EquipmentItem, deep?: boolean): boolean;
	public includes(itemOrId: TEquipmentItemResolvable, deep = false): boolean {
		if (!this.isContainer || !this.isSheath) {
			return false;
		}
		const itemId = toUuid(itemOrId);
		return this.items.find(item => item.id === itemId || deep && item.includes(itemId, deep)) !== undefined;
	}
	public invest(): void {
		this.core.isInvested = true;
		this.eq.update();
	}
	public lower(): void {
		this.core.isRaised = false;
		this.eq.update();
	}
	public merge(itemId: string): void {
		const item = this.eq.getItem(itemId);
		if (item && EquipmentItem.canMerge(this, item)) {
			this.core.count += item.count;
			item.remove();
		}
	}
	public move(containerId: UUID): void;
	public move(container: EquipmentItem): void;
	public move(containerOrId: TEquipmentItemResolvable): void {
		this.core.containerId = toUuid(containerOrId);
		delete this.core.listId;
		this.eq.update();
	}
	public raise(): void {
		this.core.isRaised = true;
		this.eq.update();
	}
	public remove(): void {
		this.items.forEach(item => item.remove());
		this.eq.removeItem(this);
	}
	public removeEntry(entry: string): void;
	public removeEntry(spell: Spell): void
	public removeEntry(entryOrEntity: string | Base): void {
		const entry = typeof (entryOrEntity) === "string" ? entryOrEntity : entryOrEntity.name;
		if (this.entries.includes(entry)) {
			this.core.entries!.splice(this.core.entries!.indexOf(entry), 1);
		}
	}
	public rename(name: string): void {
		this.core.name = name;
		this.eq.update();
	}
	public split(count = 1): void {
		this.core.count -= count;
		const core = <EquipmentItemCore>JSON.parse(JSON.stringify(this.core));
		core.count = count;
		core.id = randomUuid();
		this.eq.addItem(new EquipmentItem(this.eq, core));
	}
	public unequip(): void {
		delete this.core.containerId;
		this.core.isRaised = false;
		this.core.listId = this.eq.carried.id;
		this.eq.update();
	}
	public uninvest(): void {
		this.core.isInvested = false;
		this.eq.update();
	}
	public wear(): void {
		delete this.core.containerId;
		this.core.listId = this.eq.worn.id;
		this.eq.update();
	}

	/**************************************************************************************************************************/
	// Static Methods

	public static canMerge(a: EquipmentItem, b: EquipmentItem): boolean {
		return a.containerId === b.containerId
			&& a.listId === b.listId
			&& a.item === b.item
			&& a.itemQuality === b.itemQuality;
	}

	public static createCore<T extends HasSource>(item: T): EquipmentItemCore;
	public static createCore<T extends HasSource>(item: T, name: string): EquipmentItemCore;
	public static createCore<T extends HasSource>(item: T, name = item.name): EquipmentItemCore {
		return {
			containerId: undefined,
			count: 1,
			entries: undefined,
			itemId: item.id,
			itemQuality: "Standard",
			id: randomUuid(),
			isInvested: false,
			isRaised: false,
			listId: undefined,
			// meta: <any>{ },
			name: name,
			objectType: "EquipmentItem",
			// timestamp: new Date().getTime(),
		};
	}

}
