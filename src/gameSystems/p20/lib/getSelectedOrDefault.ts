import type { StringSelectMenuComponent } from "discord.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";
import { parseEnum } from "@rsc-utils/core-utils";

/** Gets the selected value (updated or default) for the given customId. */
export function getSelectedOrDefault(sageCommand: SageCommand, customId: string, argKey?: string): string | undefined {
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
	if (argKey) {
		return sageCommand.args.getString(argKey) ?? undefined;
	}
	return undefined;
}

/** Gets the selected value (updated or default) as a number for the given customId. */
export function getSelectedOrDefaultNumber(sageCommand: SageCommand, customId: string, argKey?: string): number | undefined {
	return numberOrUndefined(getSelectedOrDefault(sageCommand, customId, argKey));
}

/** Gets the selected value (updated or default) as an enum for the given customId. */
export function getSelectedOrDefaultEnum<T>(sageCommand: SageCommand, _enum: unknown, customId: string, argKey?: string): T | undefined {
	return parseEnum<T>(_enum, getSelectedOrDefault(sageCommand, customId, argKey));
}
