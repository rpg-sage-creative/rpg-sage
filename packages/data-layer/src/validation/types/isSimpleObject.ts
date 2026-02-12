type SimpleObject = Record<string, any>;
export function isSimpleObject<Obj extends SimpleObject = SimpleObject>(object: unknown): object is Obj {
	return object && object.constructor === Object ? true : false;
}