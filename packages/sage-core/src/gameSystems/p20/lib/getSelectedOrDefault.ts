import type { StringSelectMenuComponent } from "discord.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { parseEnum } from "@rsc-utils/core-utils";

/** Gets the selected value (updated or default) for the given customId. */
export function getSelectedOrDefault(sageCommand: SageCommand, customId: string, ...argKeys: string[]): string | undefined {
	if (sageCommand.isSageInteraction()) {
		if (sageCommand.customIdMatches(customId)) {
			return sageCommand.interaction.values[0];
		}
		for (const row of sageCommand.interaction.message.components) {
			for (const component of row.components) {
				if (component.customId === customId) {
					for (const option of (component as StringSelectMenuComponent).options) {
						if (option.default) {
							return option.value;
						}
					}
				}
			}
		}
	}
	for (const argKey of argKeys) {
		const value = sageCommand.args.getString(argKey);
		if (value !== null && value !== undefined) return value;
	}
	return undefined;
}

/** Gets the selected value (updated or default) as a number for the given customId. */
export function getSelectedOrDefaultNumber(sageCommand: SageCommand, customId: string, ...argKeys: string[]): number | undefined {
	return numberOrUndefined(getSelectedOrDefault(sageCommand, customId, ...argKeys));
}

/** Gets the selected value (updated or default) as an enum for the given customId. */
export function getSelectedOrDefaultEnum<T>(sageCommand: SageCommand, _enum: unknown, customId: string, ...argKeys: string[]): T | undefined {
	return parseEnum<T>(_enum, getSelectedOrDefault(sageCommand, customId, ...argKeys));
}
