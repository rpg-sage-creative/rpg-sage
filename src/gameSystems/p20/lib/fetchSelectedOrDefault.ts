import { parseEnum } from "@rsc-utils/core-utils";
import type { Message, MessageActionRowComponent, StringSelectMenuComponent } from "discord.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { numberOrUndefined } from "../../utils/numberOrUndefined.js";

type Input = SageCommand | Message | (SageCommand | Message)[];

/** Fetches the message. */
export async function fetchMessage(arg: SageCommand | Message): Promise<Message | undefined> {
	if ("isSageMessage" in arg) {
		return arg.fetchMessage();
	}
	if (arg.partial) {
		return arg.fetch();
	}
	return arg;
}

/** Gets the selected value (updated or default) for the given customId. */
export async function findComponent<T extends MessageActionRowComponent>(input: Input, customId: string): Promise<T | undefined> {
	const array = Array.isArray(input) ? input : [input];
	for (const item of array) {
		const message = await fetchMessage(item);
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
	}
	return undefined;
}

/** Gets the selected value (updated or default) for the given customId. */
export async function fetchSelectedOrDefault(input: Input, customId: string, argKey?: string): Promise<string | undefined> {
	const array = Array.isArray(input) ? input : [input];
	for (const item of array) {
		if ("isSageInteraction" in item) {
			if (argKey && item.args.hasString(argKey)) {
				return item.args.getString(argKey)!;
			}
			if (item.isSageInteraction() && item.customIdMatches(customId)) {
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
export async function fetchSelectedOrDefaultNumber(input: Input, customId: string, argKey?: string): Promise<number | undefined> {
	return numberOrUndefined(await fetchSelectedOrDefault(input, customId, argKey));
}

/** Gets the selected value (updated or default) as an enum for the given customId. */
export async function fetchSelectedOrDefaultEnum<T>(input: Input, _enum: unknown, customId: string, argKey?: string): Promise<T | undefined> {
	return parseEnum<T>(_enum, await fetchSelectedOrDefault(input, customId, argKey));
}
