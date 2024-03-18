import { Awaitable } from "@rsc-utils/type-utils";
import type { SageCommand } from "../../sage/model/SageCommand.js";
import { registerCommand } from "./registerCommand.js";
import { registerInteractionListener } from "../handlers.js";

type SageCommandHandler = (sageCommand: SageCommand) => Awaitable<void>;

export function registerListener(handler: SageCommandHandler, ...commands: string[]): void {
	for (const command of commands) {
		const commandParts = command.split("-");
		const tester = (cmd: SageCommand) => cmd.isCommand(...commandParts);
		registerInteractionListener(tester, handler);
		registerCommand(handler, command);
	}
}
