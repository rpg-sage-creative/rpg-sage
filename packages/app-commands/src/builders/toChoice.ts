import type { SlashCommandChoice } from "../index.js";

type Choice<T extends string | number> = { name:string; value:T; };

/** Makes sure no matter how i give/set the choice it converts to what the API needs. */
export function toChoice<T extends string | number>(choice: SlashCommandChoice): Choice<T> {
	if (Array.isArray(choice)) {
		return { name:choice[0], value:choice[1] as T };
	}
	if (typeof(choice) === "string" || typeof(choice) === "number") {
		return { name:String(choice), value:choice as T };
	}
	return { name:choice.name, value:choice.value as T ?? choice.name };
}