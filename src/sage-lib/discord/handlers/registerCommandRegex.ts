import type { SageMessage } from "../../sage/model/SageMessage";
import { ArgsManager } from "../ArgsManager";
import { registerMessageListener } from "../handlers";
import type { TCommandAndArgs, TMessageHandler } from "../types";
import { hasCommandPrefix } from "./hasCommandPrefix";

export function registerCommandRegex(matcher: RegExp, handler: TMessageHandler): void {
	const _tester = async function (sageMessage: SageMessage): Promise<TCommandAndArgs | null> {
		if (!hasCommandPrefix(sageMessage)) {
			return null;
		}
		const match = sageMessage.slicedContent.replace(/^!!?/, "").trim().match(matcher);
		if (match) {
			//TODO: move to using groups: match.groups
			return {
				command: "command-regex",
				args: new ArgsManager(Array.from(match).slice(1).map(s => s ?? ""))
			};
		}
		return null;
	};
	const _handler = async function (sageMessage: SageMessage): Promise<void> {
		return sageMessage.allowCommand ? handler(sageMessage) : sageMessage.reactBlock();
	};
	registerMessageListener(_tester, _handler, { command:matcher.source });
}