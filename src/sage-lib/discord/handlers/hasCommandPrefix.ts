import type { SageMessage } from "../../sage/model/SageMessage";

export function hasCommandPrefix(sageMessage: SageMessage): boolean {
	return sageMessage.hasPrefix
		&& /^!!?/.test(sageMessage.slicedContent);
}