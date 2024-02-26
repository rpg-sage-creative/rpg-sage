import { ObjectAsserter } from "./ObjectAsserter.js";

export class JsonAsserter<Value> extends ObjectAsserter<Value, any> {
	public constructor(public json: Value, public objectType: string) {
		super({} as any, objectType, json, false);
	}
	public static for<T>(json: T, objectType: string, keys: (keyof T)[]) {
		return new JsonAsserter(json, objectType).setKeys(keys);
	}
}