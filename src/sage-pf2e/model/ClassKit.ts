import type { RenderableContent as UtilsRenderableContent } from "../../sage-utils/utils/RenderUtils";
import type { TObjectQuantity } from "../common";
import RenderableContent from "../data/RenderableContent";
import { findByValue } from "../data/Repository";
import type Ammunition from "./Ammunition";
import type Armor from "./Armor";
import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";
import Bulk from "./Bulk";
import Coins from "./Coins";
import type Gear from "./Gear";
import { getQuantity, toObjectQuantities } from "./HasBulk";
import type Weapon from "./Weapon";

type TClassKitItem = Weapon | Ammunition | Armor | Gear;

export interface ClassKitCore extends SourcedCore<"ClassKit"> {
	name: string;
	armor?: string;
	weapons?: [];//TContentItemArray;
	gear?: [];//TContentItemArray;
	options?: string;
}

function itemToBulkString(item: TClassKitItem, quantity = 1): string {
	/*
	// let bulk = item.isWearable ? item.wornBulk : item.bulk;
	// let price = rpg.SpUtils.format(rpg.SpUtils.format(itemToSp(item, quantity)), rpg.SpUtils.DenominationType.GP) || MDASH;
	*/
	const bulkAndPrice = "";/*//` [${price}; ${new BulkCollection(bulk, item.objectType === "Ammunition" ? quantity / 10 : quantity)}]`;*/
	const contents = "";/*//item.hasContents ? ` [${getBulk(<TObjectQuantity<Gear>[]>item.contents, true)}]` : ``;*/
	const quantityString = quantity > 1 ? ` x${quantity}` : ``;
	return `${item.nameLower}${contents}${quantityString}${bulkAndPrice}`;
}

function itemToSp(item: TClassKitItem, quantity = 1): number {
	if (!item) {
		return 0;
	}
	const sp = Coins.parse(item.price!).spValue;
	if (item.objectType === "Ammunition") {
		return sp * quantity / 10;
	}
	if (quantity !== 1) {
		return sp * quantity;
	}
	return sp;
}

function _toString<T extends TClassKitItem>(objectQuantities: TObjectQuantity<T>[]): string {
	return (objectQuantities || []).map(objectQuantity => {
		const itemString = itemToBulkString(objectQuantity.object, getQuantity(objectQuantity) / (objectQuantity.object.objectType === "Ammunition" ? 10 : 1));
		const children = _toString((<any[]>objectQuantity.object.contents).concat(objectQuantity.contents));
		return children ? `${itemString} (${children})` : itemString;
	}).join(", ");
}

export default class ClassKit extends HasSource<ClassKitCore> {
	private _armor?: Armor | null;
	public get armor(): Armor | undefined {
		if (this._armor === undefined) {
			this._armor = findByValue("Armor", this.core.armor) ?? null;
		}
		return this._armor ?? undefined;
	}
	public get hasArmor(): boolean { return this.armor !== undefined; }

	private _bulk?: Bulk;
	public get bulk(): Bulk {
		if (!this._bulk) {
			const bulk = new Bulk();
			if (this.armor) {
				bulk.add(this.armor.wornBulk!);
			}
			this.weapons.forEach(weapon => bulk.add(weapon.object.bulk, weapon.object.objectType === "Ammunition" ? weapon.quantity / 10 : weapon.quantity || 1));
			this.gear.forEach(gear => bulk.add(gear.object.isWearable ? gear.object.wornBulk! : gear.object.bulk, gear.quantity || 1));
			this._bulk = bulk;
		}
		return this._bulk;
	}

	private _gear?: TObjectQuantity<Gear>[];
	public get gear(): TObjectQuantity<Gear>[] { return this._gear ?? (this._gear = toObjectQuantities<Gear>(this.core.gear!, "Gear")); }
	public get hasGear(): boolean { return this.gear.length > 0; }

	private _moneyLeftOver?: string;
	public get moneyLeftOver(): string { return this._moneyLeftOver ?? (this._moneyLeftOver = Coins.toGpString(150 - this.priceSp)); }

	public get options(): string { return this.core.options ?? ""; }
	public get hasOptions(): boolean { return !!this.core.options; }

	private _price?: string;
	private _priceSp?: number;
	private ensurePrice(): void {
		if (!this._price || !this._priceSp) {
			let sp = 0;
			if (this.hasArmor) {
				sp += itemToSp(this.armor!);
			}
			if (this.hasWeapons) {
				this.weapons.forEach(weapon => sp += itemToSp(weapon.object, weapon.quantity));
			}
			this.gear.forEach(item => sp += itemToSp(item.object, item.quantity));
			this._price = Coins.toGpString(sp);
			this._priceSp = sp;
		}
	}
	/** Formatted price value. */
	public get price(): string {
		this.ensurePrice();
		return this._price!;
	}
	/** Numerical price as SP */
	public get priceSp(): number {
		this.ensurePrice();
		return this._priceSp!;
	}

	private _weapons?: TObjectQuantity<Weapon>[];
	public get weapons(): TObjectQuantity<Weapon>[] { return this._weapons ?? (this._weapons = toObjectQuantities<Weapon>(this.core.weapons!, "Weapon")); }
	public get hasWeapons(): boolean { return this.weapons.length > 0; }

	public toRenderableContent(): UtilsRenderableContent {
		const content = new RenderableContent(this);
		content.setTitle(`<b>${this.name}</b> (Class Kit)`);
		content.append(`<b>Price</b> ${this.price}; <b>Bulk</b> ${this.bulk}; <b>Money Left Over</b> ${this.moneyLeftOver}`);
		if (this.hasArmor) {
			content.append(`<b>Armor</b> ${_toString([{ contents: [], object: this.armor!, quantity: 1 }])}`);
		}
		if (this.hasWeapons) {
			content.append(`<b>Weapons</b> ${_toString(this.weapons)}`);
		}
		if (this.hasGear) {
			content.append(`<b>Gear</b> ${_toString(this.gear)}`);
		}
		if (this.hasOptions) {
			content.append(`<b>Options</b> ${this.options}`);
		}
		return content;
	}

}
