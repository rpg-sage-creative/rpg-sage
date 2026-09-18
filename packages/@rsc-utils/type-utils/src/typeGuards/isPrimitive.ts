import { isDate } from "node:util/types";

type Primitive = Date | "bigint" | "boolean" | "number" | "string";

/** Checks to see if the object given is a primitive type: null, undefined, Date, bigint, number, string, boolean. */
export function isPrimitive(object: unknown): object is Primitive | null | undefined {
	return object === null
		|| object === undefined
		|| isDate(object)
		|| ["bigint", "boolean", "number", "string"].includes(typeof(object));
}

/**
 * @todo take a long look at why i consider Date a primitive
 * ... i think because it stringifies to a number and new Date(number|date) gets a date.
 * */