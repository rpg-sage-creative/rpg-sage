/** Used to get the keys of an enum. Use the following syntax: keys<typeof Enum>(Enum); */
export function getEnumKeys<T>(_enum: any): (keyof T)[] {
	return Object.keys(_enum)
		.filter(key => typeof(_enum[key]) === "number") as (keyof T)[];
}
