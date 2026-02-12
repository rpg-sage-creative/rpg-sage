import { isBlank } from "@rsc-utils/core-utils";

export function isEmptyString(string?: unknown) {
	return string === undefined
		|| string === null
		|| (typeof(string) === "string" && isBlank(string));
}
