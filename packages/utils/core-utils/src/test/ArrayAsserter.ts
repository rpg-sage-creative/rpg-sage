import { AsserterBase } from "./internal/AsserterBase.js";
import type { TAsserterBase } from "./internal/TAsserterBase.js";
import type { TAsserterParent } from "./internal/TAsserterParent.js";
import { ObjectAsserter } from "./ObjectAsserter.js";

type ArrayOfTester<Value = any> = (value: Value) => boolean;

type ArrayIterator<
	ValueType,
	ArrayParent extends TAsserterParent,
	Asserter extends TAsserterBase,
	> = (this: ArrayAsserter<ValueType, ArrayParent>, asserter: Asserter, index: number, array: ValueType[]) => unknown;

export class ArrayAsserter<Value, Parent extends TAsserterParent = TAsserterParent> extends AsserterBase<Value, Parent> implements TAsserterParent {
	public assertMap: Map<string, boolean>;
	public isArray: boolean;
	public keySet: Set<string>;
	public readMap: Map<string, boolean>;

	private get array(): Value[] { return this.isArray ? this.keyValue as Value[] : []; }

	public constructor(parent: Parent, key: string, keyValue: Value, optional: boolean) {
		super(parent, key, keyValue, optional);
		this.assertMap = new Map();
		this.isArray = Array.isArray(this.keyValue);
		this.keySet = new Set();
		this.readMap = new Map();
		this.array.forEach((_: any, index: number) => this.keySet.add(`${this.keyPath}.${index}`));
	}

	public of(type: string): Parent;
	public of<Value>(tester: ArrayOfTester<Value>): Parent;
	public of(type: string | ArrayOfTester) {
		if (!this.keyPresent || !this.isArray) {
			return this._assert(false);
		}

		const tester = typeof(type) === "string" ? (value: any) => typeof(value) === type : type;
		const typeMatches = this.array.map(tester);
		const hasFalse = typeMatches.includes(false);
		// we only assert a valid array if they array even exists
		return this._assert(this.keyPresent ? !hasFalse : false);
	}

	public iterate(iterator: ArrayIterator<Value, Parent, any>) {
		if (!this.keyPresent || !this.isArray) {
			return this._assert(false);
		}
		const optional = false;
		const _this = this;
		this.array.forEach((value: Value, index: number, array: Value[]) => {
			const objectAsserter = new ObjectAsserter(_this, String(index), value, optional);
			iterator.call(_this, objectAsserter, index, array);
		});
		this._assert(true);
		return this.parent;
	}

}