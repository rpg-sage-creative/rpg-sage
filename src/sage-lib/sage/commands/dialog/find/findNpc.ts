import { isNotBlank } from "@rsc-utils/string-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { Optional } from "@rsc-utils/core-utils";

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

	let char: GameCharacter | undefined;

	// try by given name/index first
	if (isNotBlank(name)) {
		char = gameNpcs?.findByName(name)
			?? gameNpcs?.findCompanion(name)
			?? userNpcs.findByName(name)
			?? userNpcs.findCompanion(name);
	}

	// try grabbing auto character
	if (!char && opts.auto) {
		const autoChannel = { channelDid:sageCommand.channelDid!, userDid:sageCommand.authorDid };
		char = gameNpcs?.getAutoCharacter(autoChannel)
			?? userNpcs.getAutoCharacter(autoChannel);
	}

	// else grab their first
	if (!char && opts.first) {
		char = gameNpcs
			? gameNpcs.first()
			: userNpcs.first();
	}

	return char;
}