import type { Optional } from "@rsc-utils/core-utils";
import { isNotBlank } from "@rsc-utils/string-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";

export function findCompanion(sageCommand: SageCommand, name: Optional<string>): GameCharacter | undefined {
	if (!sageCommand.allowDialog) return undefined;

	const { authorDid, game, isPlayer, sageUser } = sageCommand;
	if (game && !isPlayer) return undefined;

	const gamePcs = game?.playerCharacters;
	const userPcs = sageUser.playerCharacters;

	let char: GameCharacter | undefined;

	// try by given name/index first
	if (isNotBlank(name)) {
		char = gamePcs?.findCompanion(authorDid, name)
			?? userPcs.findCompanion(name);
	}

	// try grabbing auto character
	if (!char) {
		const autoChannel = { channelDid:sageCommand.channelDid!, userDid:authorDid };
		char = gamePcs?.getAutoCharacter(autoChannel)
			?? userPcs.getAutoCharacter(autoChannel);
	}

	// else grab their first
	if (!char) {
		char = gamePcs
			? gamePcs.findByUser(authorDid)?.companions.first()
			: userPcs.first()?.companions.first()
	}

	return char;
}
