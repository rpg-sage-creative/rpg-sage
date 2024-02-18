/** BigInt safe JSON.parse */
export function parse(text: string, reviver?: (this: any, key: string, value: any) => any): any {
	return JSON.parse(text, function(this: any, key: string, value: any) {
		if (typeof(value) === "string") {
			const match = /^bigint-(\d+)n$/.exec(value);
			if (match) {
				value = BigInt(match[1]);
			}
		}
		return reviver ? reviver.call(this, key, value) : value;
	});
}