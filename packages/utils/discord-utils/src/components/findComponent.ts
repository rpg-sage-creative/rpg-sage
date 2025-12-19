import type { Optional } from "@rsc-utils/core-utils";
import type { ActionRowComponent, ComponentInContainer, TopLevelComponent } from "discord.js";

type Component = ActionRowComponent | ComponentInContainer | TopLevelComponent;
type Owner = { components:Component[]; };

export function findComponent<T extends ActionRowComponent>(owner: Optional<Owner>, customId: string): T | undefined {
	if (!owner) return undefined;
	const components = owner.components ?? [];
	for (const component of components) {
		if ("customId" in component && component.customId === customId) {
			return component as T;
		}
		if ("components" in component) {
			const found = findComponent<T>(component, customId);
			if (found) {
				return found;
			}
		}
	}
	return undefined;
}