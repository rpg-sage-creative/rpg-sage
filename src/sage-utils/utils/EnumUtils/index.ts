/** Returns the (number) value of the enum for the given value, falling back to default value or undefined */
export function parse<T>(_enum: any, value: string): T | undefined;
export function parse<T>(_enum: any, value: number): T | undefined;
export function parse<T>(_enum: any, value: string, defaultValue: T): T;
export function parse<T>(_enum: any, value: number, defaultValue: T): T;
export function parse<T>(_enum: any, value: string | number, defaultValue?: T): T | undefined {
	if (typeof(value) === "number") {
		return values(_enum).find(val => val === value) as T ?? defaultValue;
	}

	const lower = String(value).toLowerCase();
	const enumKey = Object.keys(_enum).find(key => key.toLowerCase() === lower);
	if (enumKey !== undefined) {
		return _enum[enumKey] ?? defaultValue;
	}
	return defaultValue;
}

/** Used to get the keys of an enum. Use the following syntax: keys<typeof Enum>(Enum); */
export function keys<T>(_enum: any): (keyof T)[] {
	return Object.keys(_enum).filter(key => typeof(key) === "string") as (keyof T)[];
}

/** Used to get the values of an enum. Use the following syntax: values<Enum>(Enum); */
export function values<T>(_enum: any): T[] {
	return keys(_enum).map(key => _enum[key] as T);
}
