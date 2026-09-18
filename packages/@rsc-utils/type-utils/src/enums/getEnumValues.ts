
/** Used to get the values of an enum. Use the following syntax: values<Enum>(Enum); */
export function getEnumValues<T>(_enum: any): T[] {
	return Object.values(_enum)
		.filter(value => typeof(value) === "number") as T[];
}
