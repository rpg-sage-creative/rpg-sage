import { ArgsManager } from "@rsc-utils/core-utils";
import type { SageMessage } from "../../sage/model/SageMessage.js";
import { registerMessageListener } from "../handlers.js";
import type { TCommandAndArgs, TMessageHandler } from "../types.js";
import { DefaultPrefixRegExp } from "./DefaultPrefixRegExp.js";

/** @deprecated use RegisterCommand(handler, ...commands[]) */
export function registerCommandRegex(matcher: RegExp, handler: TMessageHandler): void {
	const _tester = async function (sageMessage: SageMessage): Promise<TCommandAndArgs | null> {
		const hasPrefix = sageMessage.hasPrefix && DefaultPrefixRegExp.test(sageMessage.slicedContent);
		if (!hasPrefix) {
			return null;
		}
		const match = sageMessage.slicedContent.replace(DefaultPrefixRegExp, "").trim().match(matcher);
		if (match) {
			//TODO: move to using groups: match.groups
			return {
				command: "command-regex",
				args: ArgsManager.from(Array.from(match).slice(1).map(s => s ?? ""))
			};
		}
		return null;
	};
	const _handler = async function (sageMessage: SageMessage): Promise<void> {
		return sageMessage.allowCommand ? handler(sageMessage) : sageMessage.reactBlock();
	};
	registerMessageListener(_tester, _handler, { command:matcher.source });
}