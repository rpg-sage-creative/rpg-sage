import { getKeyValueArgRegex } from "@rsc-utils/core-utils";

export function redactKeyValuePairs(content: string): string {
	const regexp = getKeyValueArgRegex({ allowDashes:true, allowPeriods:true });
	return content.replace(regexp, pair => "".padEnd(pair.length, "*"));
}