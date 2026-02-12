import type { MessageCommand } from "../../index.js";

export function registerCommand(): MessageCommand {
	return {
		name: "Dialog Lookup",
		type: 3
	};
}