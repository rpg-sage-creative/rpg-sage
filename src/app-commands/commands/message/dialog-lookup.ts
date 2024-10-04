import type { MessageCommand } from "../../types.js";

export function registerCommand(): MessageCommand {
	return {
		name: "Dialog Lookup",
		type: 3
	};
}