import type { MessageCommand } from "@rsc-utils/discord-utils";

export function registerCommand(): MessageCommand {
	return {
		name: "Dialog Lookup",
		type: 3
	};
}