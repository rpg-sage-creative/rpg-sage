import { ArgsManager, type Awaitable } from "@rsc-utils/core-utils";
import type { SageMessage } from "../../sage/model/SageMessage.js";
import { registerMessageListener } from "../handlers.js";
import type { TCommandAndArgs } from "../types.js";

type TSageMessageHandler = (sageMessage: SageMessage) => Awaitable<void>;

export function registerCommand(handler: TSageMessageHandler, ...commands: string[]): void {
	commands.forEach(key => {
		const command = key.trim().toLowerCase();
		const _tester = async function (sageMessage: SageMessage): Promise<TCommandAndArgs | null> {
			if (sageMessage.hasPrefix && /^!!?/.test(sageMessage.slicedContent)) {
				const keyRegex = command.replace(/[\-\s]+/g, "[\\-\\s]*");
				const matcher = new RegExp(`^${keyRegex}(?:$|(\\s+(?:.|\\n)*?)$)`, "i");
				const match = matcher.exec(sageMessage.slicedContent.replace(/^!!?/, "").trim());
				if (match) {
					return { command, args:ArgsManager.from(match[1]) };
				}
			}
			return null;
		};
		/** @todo make "admin" an option flag */
		registerMessageListener(_tester, handler, { command });
	});
}