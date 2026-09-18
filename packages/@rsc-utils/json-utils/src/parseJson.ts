/**
 * BigInt and Date friendly replacement for JSON.parse().
 */
export function parseJson<T = any>(text: string, reviver?: (this: any, key: string, value: any) => any): T {
	return JSON.parse(text, function(this: any, key: string, value: any) {
		// make sure we don't have another object that happens to have $bigint:string as one of many keys
		if (value && Object.keys(value).length === 1) {
			// our stringify converts a bigint to { $bigint:"" }
			if (typeof(value?.$bigint) === "string") {
				value = BigInt(value.$bigint);
			}

			// our stringify converts a Date to { $date:"" }
			if (typeof(value?.$date) === "string") {
				value = new Date(value.$date);
			}
		}

		if (reviver) return reviver.call(this, key, value);
		return value;
	});
}
