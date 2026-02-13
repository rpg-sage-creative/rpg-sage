import { isSimpleObject, tagFailure } from "../index.js";

export function assertSimpleObject(object: unknown): object is Record<string, any> {
	if (!isSimpleObject(object))
		return tagFailure`invalid simple object: ${object}`;
	return true;
}