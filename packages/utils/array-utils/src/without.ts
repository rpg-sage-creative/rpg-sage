import { type Collection } from "./Collection.js";

/** Returns a new array that doesn't contain the passed args */
export function without<T>(array: Array<T>, ...args: T[]): Array<T>;

/** Returns a new array that doesn't contain the passed args */
export function without<T>(collection: Collection<T>, ...args: T[]): Collection<T>;

export function without<T, U extends Array<T>>(array: U, ...args: T[]): U {
	return array.filter(obj => !args.includes(obj)) as U;
}