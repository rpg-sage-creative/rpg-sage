import type { TAsserterBase } from "./TAsserterBase.js";
import type { TAsserterParent } from "./TAsserterParent.js";

/** @internal */
export type TObjectAsserter<Value> = TAsserterParent & {
	array(key: keyof Value, optional?: boolean): TAsserterBase;
	object(key: keyof Value, optional?: boolean): TAsserterBase;
	value(key: keyof Value, optional?: boolean): TAsserterBase;
}