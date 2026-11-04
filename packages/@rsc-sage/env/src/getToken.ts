import { getFromProcess } from "./getFromProcess.js";

export function getToken(): string {
	const tokenValidator = (value: unknown): value is string => typeof(value) === "string" && value.length > 0;

	// We only get this once, we don't need to store it in a variable.
	return getFromProcess(tokenValidator, "botToken");
}