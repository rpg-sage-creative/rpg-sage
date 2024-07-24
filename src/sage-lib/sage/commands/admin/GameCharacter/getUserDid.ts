import type { Snowflake } from "@rsc-utils/core-utils";
import type { SageMessage } from "../../../model/SageMessage";

/** Checks for Game Player and uses their Id before checking the args. */
export async function getUserDid(sageMessage: SageMessage): Promise<Snowflake | null> {
	return !sageMessage.game || sageMessage.isPlayer
		? sageMessage.authorDid
		: sageMessage.args.removeAndReturnUserDid("user");
}