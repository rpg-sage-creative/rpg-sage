type DataConverter<T> = (value: any) => T;

/** @internal */
export function getDataConverter(dataType: "string" | "number" | "date"): DataConverter<any> {
	switch(dataType) {
		case "date":
			return (value: any) => new Date(value);
		case "number":
			return Number;
		case "string":
			return String;
		default:
			return Object;
	}
}