export function jsonStringify(value: any): string {
	return JSON.stringify(value, function(_key: string, _value: any) {
		return typeof(_value) === "bigint" ? `bigint-${_value}n` : _value;
	});
}