/**
 * BigInt, Date, and non-finite-number friendly replacement for JSON.parse().
 * Restores the wrappers produced by stringifyJson: { $bigint }, { $date }, and { $number } (NaN, -0, ±Infinity).
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

			// our stringify converts JSON-inexpressible numbers to { $number:"NaN"|"-0"|"Infinity"|"-Infinity" }
			if (typeof(value?.$number) === "string") {
				// exact payload match so user data like { $number:"5" } is left alone
				const numberText = value.$number;
				if (numberText === "NaN") value = NaN;
				else if (numberText === "-0") value = -0;
				else if (numberText === "Infinity") value = Infinity;
				else if (numberText === "-Infinity") value = -Infinity;
			}
		}

		if (reviver) return reviver.call(this, key, value);
		return value;
	});
}
