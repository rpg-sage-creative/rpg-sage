import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { SageCommand } from "../../../model/SageCommand.js";

/** Checks for Game Player and uses their Id before checking the args. */
export function getUserDid(sageCommand: SageCommand): Optional<Snowflake> {
	return !sageCommand.game || sageCommand.isPlayer
		? sageCommand.authorDid
		: sageCommand.args.getUserId("user");
}