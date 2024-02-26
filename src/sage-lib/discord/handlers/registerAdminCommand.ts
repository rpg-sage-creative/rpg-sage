import type { Awaitable } from "@rsc-utils/type-utils";
import type { SageMessage } from "../../sage/model/SageMessage.js";
import { registerCommand } from "./registerCommand.js";

type TSageMessageHandler = (sageMessage: SageMessage) => Awaitable<void>;

/** @deprecated use registerCommand */
export function registerAdminCommand(handler: TSageMessageHandler, ...commands: string[]): void {
	registerCommand(handler, ...commands);
}