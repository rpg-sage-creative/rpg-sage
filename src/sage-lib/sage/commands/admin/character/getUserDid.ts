import { Snowflake } from "discord.js";
import { SageMessage } from "../../../model/SageMessage";

/**
 * If no game, or the actor is a player, return the actor's did.
 * Otherwise, return the "user" arg or null if not found.
 */
export function getUserDid(sageMessage: SageMessage): Snowflake | null {
	if (!sageMessage.game || sageMessage.isPlayer) {
		return sageMessage.actor.did
	}
	return sageMessage.args.findUserDid("user") ?? null;
}
