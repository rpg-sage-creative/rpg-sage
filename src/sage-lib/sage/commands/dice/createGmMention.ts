import { toRoleMention, toUserMention } from "@rsc-utils/discord-utils";
import { GameUserType } from "../../model/Game.js";
import type { SageCommand } from "../../model/SageCommand.js";

/**
 * Creates the GM mention for a dice roll message.
 * @todo consider possibility of mentioning a GM in a non-game (by role?)
 */
export function createGmMention(sageCommand: SageCommand): string {
	// we only do GM menions if we have a Game
	const game = sageCommand.game;
	if (!game) {
		return "";
	}

	// check the GM Role first
	const gmRole = game.gmRole;
	if (gmRole) {
		// only mention the GM Role if pings are enabled for it
		return gmRole.dicePing ? toRoleMention(gmRole.did) ?? "" : "";
	}

	// find the first GM that hasn't turned off pings
	const gameUser = game.users.find(user => user.type === GameUserType.GameMaster && user.dicePing !== false);

	// return the mention
	return toUserMention(gameUser?.did) ?? "";
}