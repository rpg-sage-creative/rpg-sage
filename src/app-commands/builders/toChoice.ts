import type { SlashCommandChoice } from "../types.js";

/** Makes sure no matter how i give/set the choice it converts to what the API needs. */
export function toChoice(choice: SlashCommandChoice): [string, string] {
	if (Array.isArray(choice)) {
		return [choice[0], choice[1]];
	}
	if (typeof(choice) === "string") {
		return [choice, choice];
	}
	return [choice.name, choice.value ?? choice.name];
}