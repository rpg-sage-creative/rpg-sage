import type { SageMessage } from "../../sage/model/SageMessage";
import { hasCommandPrefix } from "./hasCommandPrefix";

export function hasAdminCommandPrefix(sageMessage: SageMessage): boolean {
	return hasCommandPrefix(sageMessage)
		&& !/^!!?\s*help/i.test(sageMessage.slicedContent);
}