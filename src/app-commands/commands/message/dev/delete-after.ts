import type { MessageCommand } from "../../../types.js";

export function registerCommand(): MessageCommand {
	return {
		name: "Delete After",
		type: 3
	};
}