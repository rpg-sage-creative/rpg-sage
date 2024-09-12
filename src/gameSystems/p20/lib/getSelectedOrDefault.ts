import type { StringSelectMenuComponent, StringSelectMenuInteraction } from "discord.js";
import type { SageInteraction } from "../../../sage-lib/sage/model/SageInteraction.js";

/** Gets the selected value (updated or default) for the given customId. */
export function getSelectedOrDefault(sageInteraction: SageInteraction<StringSelectMenuInteraction>, customId: string): string | undefined {
	if (sageInteraction.customIdMatches(customId)) {
		return sageInteraction.interaction.values[0];
	}
	for (const row of sageInteraction.interaction.message.components) {
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
	return undefined;
}