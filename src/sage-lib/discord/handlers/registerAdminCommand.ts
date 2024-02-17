import type { Awaitable } from "@rsc-utils/type-utils";
import type { SageMessage } from "../../sage/model/SageMessage";
import { ArgsManager } from "../ArgsManager";
import { registerMessageListener } from "../handlers";
import type { TCommandAndArgs } from "../types";
import { hasAdminCommandPrefix } from "./hasAdminCommandPrefix";

type TSageMessageHandler = (sageMessage: SageMessage) => Awaitable<void>;

export function registerAdminCommand(handler: TSageMessageHandler, ...commands: string[]): void {
	commands.forEach(key => {
		const command = key.trim().toLowerCase();
		const keyRegex = command.replace(/[\-\s]+/g, "[\\-\\s]*");
		const matcher = RegExp(`^${keyRegex}(?:$|(\\s+(?:.|\\n)*?)$)`, "i");

		const _tester = async function (sageMessage: SageMessage): Promise<TCommandAndArgs | null> {
			if (hasAdminCommandPrefix(sageMessage)) {
				const match = sageMessage.slicedContent.replace(/^!!?/, "").trim().match(matcher);
				if (match) {
					return { command, args: new ArgsManager(match[1]) };
				}
			}
			return null;
		};
		registerMessageListener(_tester, handler, { command });
	});
}