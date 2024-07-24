type DataConverter<T> = (value: any) => T;

/** Converts the value to a Date using new Date(value) */
function newDate(value: any): Date {
	return new Date(value);
}

/** @internal */
export function getDataConverter(dataType: "string" | "number" | "date"): DataConverter<any> {
	switch(dataType) {
		case "date":
			return newDate;
		case "number":
			return Number;
		case "string":
			return String;
		default:
			return Object;
	}
}