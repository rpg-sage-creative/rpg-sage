import { parseEnum } from "@rsc-utils/core-utils";
import type { StringSelectMenuComponent } from "discord.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { findComponent, type MessagesOrSageCommand } from "./findComponent.js";

/** Gets the selected value (updated or default) for the given customId. */
export async function fetchSelectedOrDefault(input: MessagesOrSageCommand, customId: string, argKey?: string): Promise<string | undefined> {
	const array = Array.isArray(input) ? input : [input];
	for (const item of array) {
		if ("isSageInteraction" in item) {
			if (argKey && item.args.hasString(argKey)) {
				return item.args.getString(argKey)!;
			}
			if (item.isSageInteraction("SELECT") && item.customIdMatches(customId)) {
				return item.interaction.values[0];
			}
		}
		const component = await findComponent<StringSelectMenuComponent>(item, customId);
		if (component) {
			for (const option of component.options) {
				if (option.default) {
					return option.value;
				}
			}
		}
	}
	return undefined;
}

/** Gets the selected value (updated or default) as a number for the given customId. */
export async function fetchSelectedOrDefaultNumber(input: MessagesOrSageCommand, customId: string, argKey?: string): Promise<number | undefined> {
	return numberOrUndefined(await fetchSelectedOrDefault(input, customId, argKey));
}

/** Gets the selected value (updated or default) as an enum for the given customId. */
export async function fetchSelectedOrDefaultEnum<T>(input: MessagesOrSageCommand, _enum: unknown, customId: string, argKey?: string): Promise<T | undefined> {
	return parseEnum<T>(_enum, await fetchSelectedOrDefault(input, customId, argKey));
}
