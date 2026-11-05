import type { MessageCommand } from "@rsc-chat/discord-utils";

export function registerCommand(): MessageCommand {
	return {
		name: "Dialog Lookup",
		type: 3
	};
}