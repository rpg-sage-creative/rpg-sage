import type { MessageActionRowComponent } from "discord.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";

/** Gets the selected value (updated or default) for the given customId. */
export async function findComponent<T extends MessageActionRowComponent>(sageCommand: SageCommand, customId: string): Promise<T | undefined> {
	const message = await sageCommand.fetchMessage();
	const components = message?.components;
	if (components?.length) {
		for (const row of components) {
			for (const component of row.components) {
				if (component.customId === customId) {
					return component as T;
				}
			}
		}
	}
	return undefined;
}