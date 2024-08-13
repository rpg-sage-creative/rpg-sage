import type { Optional } from "@rsc-utils/core-utils";
import { isNotBlank } from "@rsc-utils/string-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";

type Options = {
	auto: boolean;
	first: boolean;
};

export function findPc(sageCommand: SageCommand, name: Optional<string>, opts: Options): GameCharacter | undefined {
	// if (!sageCommand.allowDialog) return undefined;

	const { authorDid, game, isPlayer, sageUser } = sageCommand;
	if (game && !isPlayer) return undefined;

	const gamePcs = game?.playerCharacters;
	const userPcs = sageUser.playerCharacters;

	let char: GameCharacter | undefined;

	// try by given name/index first
	if (isNotBlank(name)) {
		char = gamePcs?.filterByUser(authorDid).findByName(name)
			?? userPcs.findByName(name);
	}

	// try grabbing auto character
	if (!char && opts.auto) {
		const autoChannel = { channelDid:sageCommand.channelDid!, userDid:authorDid };
		char = gamePcs?.getAutoCharacter(autoChannel)
			?? userPcs.getAutoCharacter(autoChannel);
	}

	// else grab their first
	if (!char && opts.first) {
		char = gamePcs
			? gamePcs.findByUser(authorDid)
			: userPcs.first();
	}

	return char;
}
