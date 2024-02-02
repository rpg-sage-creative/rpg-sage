import { ArrayAsserter } from "./ArrayAsserter.js";
import { AsserterBase, type TAsserterParent, type TObjectAsserter } from "./internal/index.js";
import { ValueAsserter } from "./ValueAsserter.js";

export class ObjectAsserter<Value, Parent extends TAsserterParent = TAsserterParent> extends AsserterBase<Value, Parent> implements TObjectAsserter<Value> {
	public assertMap: Map<string, boolean>;
	public keySet: Set<string>;
	public readMap: Map<string, boolean>;

	public constructor(parent: Parent, key: string, keyValue: Value, optional: boolean) {
		super(parent, key, keyValue, optional);
		this.assertMap = new Map();
		this.keySet = new Set();
		this.readMap = new Map();
	}

	public array<Child extends any = any>(key: keyof Value, optional?: boolean): ArrayAsserter<Child, this> {
		key = String(key) as keyof Value;
		this.readMap.set(key as string, true);
		return new ArrayAsserter(this, key as string, this.keyValue?.[key] as Child, !!optional);
	}
	public object<Child>(key: keyof Value, optional?: boolean): ObjectAsserter<Child, this> {
		key = String(key) as keyof Value;
		this.readMap.set(key as string, true);
		return new ObjectAsserter(this, key as string, this.keyValue?.[key] as Child, !!optional);
	}
	public assert(handler: (asserter: ObjectAsserter<any, any>) => void) {
		this.parent.assertMap.set(this.key, true);
		handler(this);
		return this.parent;
	}
	public value<Child>(key: keyof Value, optional?: boolean): ValueAsserter<Child, this> {
		key = String(key) as keyof Value;
		this.readMap.set(key as string, true);
		return new ValueAsserter(this, key as string, this.keyValue?.[key] as Child, !!optional);
	}

	public setKeys(keys: (keyof Value)[]): this;
	public setKeys<Key = keyof Value>(...keys: (keyof Value)[]): this;
	public setKeys(...args: ((keyof Value) | (keyof Value)[])[]) {
		const keys = args.flat().map(String).sort();
		keys.forEach(key => {
			this.keySet.add(key as string);
			if (!this.readMap.has(key as string)) this.readMap.set(key as string, false);
			if (!this.assertMap.has(key as string)) this.assertMap.set(key as string, false);
		});
		return this;
	}

	public todo(): this {
		const allKeySet = Array.from(new Set(Array.from(this.keySet).concat(Object.keys(this.keyValue ?? {})))).sort();
		allKeySet.forEach(key => {
			const valid = this.keySet.has(key);
			const read = this.readMap.get(key);
			const assert = this.assertMap.get(key);
			const todoOut = valid ? [read ? "" : "READ", assert ? "" : "ASSERT"].filter(s => s).join("/") : "INVALID";
			console.assert(read && assert, `${this.keyPath}.${key} @TODO ${todoOut}`);
		});
		return this;
	}

	public boolean(key: keyof Value, optional = false): this {
		return this.value(key, optional).boolean();
	}
	public enum<Enum>(key: keyof Value, enumObj: Enum, optional = false): this {
		return this.value(key, optional).enum(enumObj);
	}
	public number(key: keyof Value, optional = false): this {
		return this.value(key, optional).number();
	}
	public snowflake(key: keyof Value, optional = false): this {
		return this.value(key, optional).snowflake();
	}
	public string(key: keyof Value, optional = false): this {
		return this.value(key, optional).string();
	}

}