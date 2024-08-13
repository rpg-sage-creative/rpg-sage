import { isBlank } from "@rsc-utils/string-utils";
import type { Optional } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";

export function findPc(sageCommand: SageCommand, pcNameOrIndex: Optional<string>): GameCharacter | undefined {
	if (!sageCommand.allowDialog) return undefined;

	const { authorDid, game, sageUser } = sageCommand;
	const gamePcs = game?.playerCharacters;
	const userPcs = sageUser.playerCharacters;

	let char: GameCharacter | undefined;

	// try by given name/index first
	if (!isBlank(pcNameOrIndex)) {
		const index = +pcNameOrIndex;
		if (isNaN(index)) {
			char = gamePcs?.filterByUser(authorDid).findByName(pcNameOrIndex)
				?? userPcs.findByName(pcNameOrIndex);
		}else {
			char = gamePcs?.filterByUser(authorDid)[index]
				?? userPcs[index];
		}
	}

	// try grabbing auto character
	if (!char) {
		const autoChannel = { channelDid:sageCommand.channelDid!, userDid:authorDid };
		char = gamePcs?.getAutoCharacter(autoChannel)
			?? userPcs.getAutoCharacter(autoChannel)
			?? undefined;
	}

	// else grab their first
	if (!char) {
		char = gamePcs
			? gamePcs.findByUser(authorDid)
			: userPcs.first();
	}

	return char;
}
