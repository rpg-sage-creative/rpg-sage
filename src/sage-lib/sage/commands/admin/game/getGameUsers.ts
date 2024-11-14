import { GameUserType, type GameUserData } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";

export async function getGameUsers(sageCommand: SageCommand): Promise<GameUserData[]> {
	const users: GameUserData[] = [];

	// do both "gm" and "gms" in case a posted command has the old gm= for the GM and not for the GM Channel
	const gmIds = await sageCommand.args.getUserIds("gm", true);
	gmIds.forEach(did => users.push({ did, type:GameUserType.GameMaster, dicePing:true }));

	const gmsIds = await sageCommand.args.getUserIds("gms", true);
	gmsIds.forEach(did => users.push({ did, type:GameUserType.GameMaster, dicePing:true }));

	// do both "player" and "players" in case they add a "player role" and use singular term
	const playerIds = await sageCommand.args.getUserIds("player", true);
	playerIds.forEach(did => users.push({ did, type:GameUserType.Player, dicePing:true }));

	const playersIds = await sageCommand.args.getUserIds("players", true);
	playersIds.forEach(did => users.push({ did, type:GameUserType.Player, dicePing:true }));

	return users;
}