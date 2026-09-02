type SimpleObject = Record<string, any>;

/** TypeGuard for objects created as: {} */
export function isSimpleObject<Obj extends SimpleObject = SimpleObject>(object: unknown): object is Obj {
	return object ? object.constructor === Object : false;
}