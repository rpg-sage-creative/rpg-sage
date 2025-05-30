import { isBlank, type Optional } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";

type Options = {
	auto: boolean;
	first: boolean;
};

export function findNpc(sageCommand: SageCommand, name: Optional<string>, opts: Options): GameCharacter | undefined {
	// if (!sageCommand.allowDialog) return undefined;

	const { game, isGameMaster } = sageCommand;
	if (game && !isGameMaster) return undefined;

	const gameNpcs = game?.nonPlayerCharacters;
	const userNpcs = sageCommand.sageUser.nonPlayerCharacters;

	const isNameBlank = isBlank(name);

	// try by given name/index first
	if (!isNameBlank) {
		const namedChar = gameNpcs?.findByName(name)
			?? gameNpcs?.findCompanion(name)
			?? userNpcs.findByName(name)
			?? userNpcs.findCompanion(name);
		if (namedChar) return namedChar;
	}

	// try grabbing auto character
	if (opts.auto) {
		const autoChannel = { channelDid:sageCommand.channelDid!, userDid:sageCommand.actorId };
		const autoChar = gameNpcs?.getAutoCharacter(autoChannel)
			?? userNpcs.getAutoCharacter(autoChannel);
		if (autoChar) return autoChar;
	}

	// else grab their first
	if (opts.first) {
		const firstChar = gameNpcs
			? gameNpcs.first()
			: userNpcs.first();
		if (firstChar) return firstChar;
	}

	return undefined;
}