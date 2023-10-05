import { warn } from "../../sage-utils/utils/ConsoleUtils";
import type { HasContents, HasParent, HasQuantity, IHasContents, IHasParent, IHasQuantity, TContentItem, TContentItemArray, TObjectQuantity } from "../common";
import { MDASH } from "../common";
import { filter, findByValue } from "../data/Repository";
import type { TDetail } from "../model/base/interfaces";
import type Base from "./base/Base";
import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";
import Bulk from "./Bulk";

export function toObjectQuantities<T extends HasBulk>(contentItems: TContentItemArray, defaultObjectType: string): TObjectQuantity<T>[] {
	return (contentItems ?? []).map(contentItem => toObjectQuantity(contentItem, defaultObjectType));
}
export function toObjectQuantity<T extends HasBulk>(contentItem: TContentItem, defaultObjectType: string): TObjectQuantity<T> {
	const objectQuantity: TObjectQuantity<T> = { contents: <TObjectQuantity<T>[]>[], object: null!, quantity: 1 };
	if (typeof (contentItem) === "string") {
		objectQuantity.object = findByValue(defaultObjectType, contentItem)! as T;
	} else {
		objectQuantity.contents.push(...toObjectQuantities<T>(contentItem.contents, defaultObjectType));
		objectQuantity.object = findByValue(contentItem.objectType ?? defaultObjectType, contentItem.name)! as T;
		objectQuantity.quantity = contentItem.quantity || 1;
	}
	if (!objectQuantity.object) {
		warn(defaultObjectType, contentItem);
	}
	return objectQuantity;
}
export function getBulk<T extends HasBulk>(objectQuantities: TObjectQuantity<T>[], wornBulk: boolean): Bulk {
	const bulk = new Bulk();
	objectQuantities.forEach(objectQuantity => {
		bulk.add(wornBulk && objectQuantity.object.isWearable ? objectQuantity.object.wornBulk! : objectQuantity.object.bulk, objectQuantity.quantity || 1);
		bulk.add(getBulk(objectQuantity.contents ?? [], wornBulk));
	});
	return bulk;
}
export function getQuantity<T extends Base>(objectQuantity: TObjectQuantity<T>): number {
	const quantityInSet = (<HasQuantity<IHasQuantity>><any>objectQuantity.object).quantity || 1,
		quantityOfSets = objectQuantity.quantity || 1;
	return quantityInSet * quantityOfSets;
}

export interface BulkCore<T extends string = string> extends SourcedCore<T>, IHasContents, IHasParent {
	bulk: string;
	maxBulk: string;
	wornBulk: string;
}

export default class HasBulk<T extends BulkCore = BulkCore, U extends HasBulk<T, U> = HasBulk<any, any>> extends HasSource<T> implements HasContents<U>, HasParent<U> {
	private _bulk?: Bulk;
	public get bulk(): Bulk {
		if (!this._bulk) {
			this._bulk = new Bulk(this.core.bulk);
		}
		return this._bulk;
	}

	private _isContainer?: boolean;
	public get isContainer(): boolean {
		if (this._isContainer === undefined) {
			this._isContainer = Bulk.isValidBulk(this.core.maxBulk);
		}
		return this._isContainer;
	}

	public isEquippable = false;

	private _isWearable?: boolean;
	public get isWearable(): boolean {
		if (this._isWearable === undefined) {
			this._isWearable = Bulk.isValidBulk(this.core.wornBulk);
		}
		return this._isWearable;
	}

	private _maxBulk?: Bulk;
	public get maxBulk(): Bulk | undefined {
		return this.isContainer ? this._maxBulk ?? (this._maxBulk = new Bulk(this.core.maxBulk)) : undefined;
	}

	private _wornBulk?: Bulk;
	public get wornBulk(): Bulk | undefined {
		return this.isWearable ? this._wornBulk ?? (this._wornBulk = new Bulk(this.core.wornBulk)) : undefined;
	}

	//#region renderable
	protected toRenderableBulkString(): string {
		const bulks: string[] = [];
		if (this.isWearable) {
			bulks.push(`<b>Bulk</b> ${this.wornBulk ?? MDASH} (worn), ${this.bulk || MDASH} (carried)`);
		} else {
			bulks.push(`<b>Bulk</b> ${this.bulk ?? MDASH}`);
		}
		if (this.isContainer) {
			bulks.push(`<b>Max Bulk</b> ${this.maxBulk}`);
		}
		return bulks.join("; ");
	}
	//#endregion

	// #region HasContents
	private _contents?: TObjectQuantity<U>[];
	public get contents(): TObjectQuantity<U>[] {
		if (this._contents === undefined) {
			this._contents = toObjectQuantities(this.core.contents, this.objectType);
		}
		return this._contents;
	}
	public get hasContents(): boolean {
		return this.contents.length > 0;
	}
	// #endregion CanHaveChildren

	// #region HasParent
	private _children?: U[];
	public get children(): U[] {
		if (this._children === undefined) {
			this._children = filter(this.objectType, o => o.parent === <U><unknown>this);
		}
		return this._children;
	}
	public get hasChildren(): boolean {
		return this.children.length > 1;
	}

	private _parent?: U | null;
	public get hasParent(): boolean {
		return this.parent !== undefined;
	}
	public get parent(): U | undefined {
		if (this._parent === undefined) {
			this._parent = findByValue(this.objectType, this.core.parent) as U ?? null;
		}
		return this._parent ?? undefined;
	}
	// #endregion HasParent

	//#region IHasDetails
	private _details?: TDetail[];
	public get details(): TDetail[] {
		if (!this._details) {
			this._details = this.parent?.details.slice() ?? [];
			if (Array.isArray(this.core.details)) {
				this._details.push(...this.core.details);
			}
		}
		return this._details;
	}
	//#endregion
}
