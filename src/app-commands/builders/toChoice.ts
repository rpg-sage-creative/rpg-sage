import type { SlashCommandChoice } from "../types.js";

type Choice = { name:string; value:string; };

/** Makes sure no matter how i give/set the choice it converts to what the API needs. */
export function toChoice(choice: SlashCommandChoice): Choice {
	if (Array.isArray(choice)) {
		return { name:choice[0], value:choice[1] };
	}
	if (typeof(choice) === "string") {
		return { name:choice, value:choice };
	}
	return { name:choice.name, value:choice.value ?? choice.name };
}