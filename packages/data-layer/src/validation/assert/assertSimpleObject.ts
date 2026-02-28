import { isSimpleObject, tagFailure } from "../index.js";

export function assertSimpleObject<Type>(object: unknown): object is Type {
	if (!isSimpleObject(object))
		return tagFailure`invalid simple object: ${object}`;
	return true;
}