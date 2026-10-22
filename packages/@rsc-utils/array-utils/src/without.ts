/** Returns a new array that doesn't contain the passed args */
export function without<T, U extends T[] = T[]>(array: T[], ...args: T[]): U {
	return array.filter(obj => !args.includes(obj)) as U;
}