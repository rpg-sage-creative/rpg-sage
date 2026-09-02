import type { MessageCommand } from "@rsc-utils/discord-utils";

export function registerCommand(): MessageCommand {
	return {
		name: "Delete After",
		type: 3
	};
}