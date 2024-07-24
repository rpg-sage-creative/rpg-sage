/** @internal */
export type TAsserterBase<Value extends any = any> = {
	keyPath: string;
	keyPresent: boolean;
	keyValue: Value;
}