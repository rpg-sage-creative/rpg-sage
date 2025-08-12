import { isBlank, type Optional } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";

type Options = {
	auto: boolean;
	first: boolean;
};

export function findNpc(sageCommand: SageCommand, name: Optional<string>, opts: Options): GameCharacter | undefined {
	// if (!sageCommand.allowDialog) return undefined;

	const { actor, game } = sageCommand;

	// reusable logic for when to allow a user to use an npc
	const ret = (char?: GameCharacter) => {
		// anybody can use an NPC outside a Game
		if (!game) return char;
		// GMs can always use an NPC
		if (actor.isGameMaster) return char;
		// non-GM must have the npc assigned to them
		return actor.id === char?.userDid ? char : undefined;
	}

	const gameNpcs = game?.nonPlayerCharacters;
	const userNpcs = sageCommand.sageUser.nonPlayerCharacters;

	const isNameBlank = isBlank(name);

	// try by given name/index first
	if (!isNameBlank) {
		const namedChar = gameNpcs?.findByName(name)
			?? gameNpcs?.findCompanion(name)
			?? userNpcs.findByName(name)
			?? userNpcs.findCompanion(name);
		if (namedChar) return ret(namedChar);
	}

	// try grabbing auto character
	if (opts.auto) {
		const autoChannel = { channelDid:sageCommand.channelDid!, userDid:actor.id! };
		const autoChar = gameNpcs?.getAutoCharacter(autoChannel)
			?? userNpcs.getAutoCharacter(autoChannel);
		if (autoChar) return ret(autoChar);
	}

	// else grab their first
	if (opts.first) {
		return ret((gameNpcs ?? userNpcs)[0]);
	}

	return undefined;
}