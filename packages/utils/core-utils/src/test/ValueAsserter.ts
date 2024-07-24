import { AsserterBase } from "./internal/AsserterBase.js";
import type { TAsserterParent } from "./internal/TAsserterParent.js";

export class ValueAsserter<Value, Parent extends TAsserterParent> extends AsserterBase<Value, Parent> {

	public boolean() {
		return this.typeOf("boolean");
	}

	public enum<Enum>(enumObj: Enum) {
		const values = Object.values(enumObj as any);
		const numbers = values.filter(key => typeof(key) === "number") as Value[];
		return this.in(numbers);
	}

	public in(array: Value[]) {
		return this._assert(array.includes(this.keyValue));
	}

	public is(expected: Value) {
		return this._assert(this.keyValue === expected);
	}

	public number() {
		return this.typeOf("number");
	}

	public snowflake() {
		if (typeof(this.keyValue) === "string") {
			const isSnowflake = this.keyValue.match(/^\d{16,}$/) !== null;
			return this._assert(isSnowflake);
		}
		return this._assert(false);
	}

	public string() {
		return this.typeOf("string");
	}

	public test(tester: (value: any) => boolean) {
		return this._assert(tester(this.keyValue));
	}

	/** Asserts that the value's type is that of the given type. */
	public typeOf(type: string): Parent;
	/** Asserts that the value's type is one of the given types. */
	public typeOf(...types: string[]): Parent;
	public typeOf(...types: string[]): Parent {
		return this._assert(types.includes(typeof(this.keyValue)));
	}

}