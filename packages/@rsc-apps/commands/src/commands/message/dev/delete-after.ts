import type { MessageCommand } from "@rsc-chat/discord-utils";

export function registerCommand(): MessageCommand {
	return {
		name: "Delete After",
		type: 3
	};
}