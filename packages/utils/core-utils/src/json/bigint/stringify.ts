/** BigInt safe JSON.stringify */
export function stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;
export function stringify(value: any, replacer?: (string | number)[] | null, space?: string | number): string;
export function stringify(value: any, replacer?: Function | (string | number)[] | null, space?: string | number): string {
	return JSON.stringify(value, function(this: any, key: string, value: any) {
		let retVal = value;
		if (replacer) {
			if (typeof(replacer) === "function") {
				retVal = replacer.call(this, key, value);
			}else if (Array.isArray(replacer) && !replacer.some(_key => String(_key) === key)) {
				retVal = undefined!;
			}
		}
		return typeof(retVal) === "bigint" ? `bigint-${retVal}n` : retVal;
	}, space);
}