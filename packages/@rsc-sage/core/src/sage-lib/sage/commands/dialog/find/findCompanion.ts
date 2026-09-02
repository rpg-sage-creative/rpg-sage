import { isBlank, type Optional } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";

type Options = {
	auto: boolean;
	first: boolean;
};

export function findCompanion(sageCommand: SageCommand, name: Optional<string>, opts: Options): GameCharacter | undefined {
	// if (!sageCommand.allowDialog) return undefined;

	const { actorId, game, isGameMaster, isPlayer, sageUser } = sageCommand;
	if (game && !isPlayer && !isGameMaster) return undefined;

	const gamePcs = game?.playerCharacters;
	const userPcs = sageUser.playerCharacters;

	const isNameBlank = isBlank(name);

	// try by given name/index first
	if (!isNameBlank) {
		const namedComp = gamePcs?.findCompanion(isGameMaster ? undefined : actorId, name)
			?? userPcs.findCompanion(name);
		if (namedComp) return namedComp;
	}

	// try grabbing auto character
	if (opts.auto) {
		const autoArg = { channelId:sageCommand.channelDid!, userId:actorId };
		const autoResult = gamePcs?.getAutoCharacter(autoArg)
			?? userPcs.getAutoCharacter(autoArg);
		if (autoResult) return autoResult.char;
	}

	// else grab their first
	if (isNameBlank && opts.first) {
		return gamePcs
			? gamePcs.findByUser(actorId)?.companions[0]
			: userPcs[0]?.companions[0];
	}

	return undefined;
}
