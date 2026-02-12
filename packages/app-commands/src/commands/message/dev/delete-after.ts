import type { MessageCommand } from "../../../index.js";

export function registerCommand(): MessageCommand {
	return {
		name: "Delete After",
		type: 3
	};
}