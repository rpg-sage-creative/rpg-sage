import { getFromProcess } from "@rsc-utils/core-utils";

export function getToken(): string {
	const tokenValidator = (value: unknown) => typeof(value) === "string" && value.length;

	// We only get this once, we don't need to store it in a variable.
	return getFromProcess(tokenValidator, "botToken");
}