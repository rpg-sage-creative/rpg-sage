import type { TAsserterBase } from "./TAsserterBase.js";
import type { TAsserterParent } from "./TAsserterParent.js";
import { jsonStringify } from "./jsonStringify.js";

/** @internal */
export abstract class AsserterBase<Value, Parent extends TAsserterParent> implements TAsserterBase<Value> {
	public parent: Parent;
	public key: string;
	public keyPath: string;
	public keyPresent: boolean;
	public keyValue: Value;
	public optional: boolean;

	public constructor(parent: Parent, key: string, keyValue: Value, optional: boolean) {
		this.parent = parent;
		this.key = key;
		this.keyPath = parent?.keyPath ? `${parent.keyPath}.${key}` : key;
		this.keyPresent = key && parent?.keyValue ? key in parent.keyValue : false;
		this.keyValue = keyValue;
		this.optional = optional;
	}

	protected _assert(testBool: boolean): Parent {
		this.parent.assertMap.set(this.key, true);
		const assertBool = this.optional ? !this.keyPresent || testBool : testBool;
		const assertMessage = `${this.keyPath} :: ${jsonStringify(this.keyValue)}`;
		console.assert(assertBool, assertMessage);
		return this.parent;
	}

}