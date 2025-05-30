import { isBlank, type Optional } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";

type Options = {
	auto: boolean;
	first: boolean;
};

export function findPc(sageCommand: SageCommand, name: Optional<string>, opts: Options): GameCharacter | undefined {
	// if (!sageCommand.allowDialog) return undefined;

	const { actorId, game, isGameMaster, isPlayer, sageUser } = sageCommand;
	if (game && !isPlayer && !isGameMaster) return undefined;

	const gamePcs = game?.playerCharacters;
	const userPcs = sageUser.playerCharacters;

	const isNameBlank = isBlank(name);

	// try by given name/index first
	if (!isNameBlank) {
		const namedChar = (isGameMaster ? gamePcs : gamePcs?.filterByUser(actorId))?.findByName(name)
			?? userPcs.findByName(name);
		if (namedChar) return namedChar;
	}

	// try grabbing auto character
	if (opts.auto) {
		const autoChannel = { channelDid:sageCommand.channelDid!, userDid:actorId };
		const autoChar = gamePcs?.getAutoCharacter(autoChannel)
			?? userPcs.getAutoCharacter(autoChannel);
		if (autoChar) return autoChar;
	}

	// else grab their first
	if (isNameBlank && opts.first) {
		const firstChar = gamePcs
			? gamePcs.findByUser(actorId)
			: userPcs.first();
		if (firstChar) return firstChar;
	}

	return undefined;
}
