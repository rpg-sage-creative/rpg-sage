import { debug } from "@rsc-utils/core-utils";

type Command = { commandMatches(regex: RegExp): boolean; };

type TCharacterTypeMetaMatchFlags = {
	isCompanion: boolean;
	isCompanionOrMinion: boolean;
	isGm: boolean;
	isGmOrNpcOrMinion: boolean;
	isMinion: boolean;
	isNpc: boolean;
	isPc: boolean;
	isPcOrCompanion: boolean;
};

function getCharacterTypeMetaMatchFlags(cmd: Command): TCharacterTypeMetaMatchFlags {
	const isCompanion = cmd.commandMatches(/^(alt|companion|familiar|hireling)/i);
	const isGm = cmd.commandMatches(/^(gm|gamemaster)/i);
	const isMinion = cmd.commandMatches(/^(minion)/i);
	const isNpc = cmd.commandMatches(/^(npc|nonplayercharacter)/i);
	const isPc = cmd.commandMatches(/^(pc|playercharacter)/i);
	return {
		isCompanion,
		isCompanionOrMinion: isCompanion || isMinion,
		isGm,
		isGmOrNpcOrMinion: isGm || isNpc || isMinion,
		isMinion,
		isNpc,
		isPc,
		isPcOrCompanion: isPc || isCompanion
	};
}

export type TCharacterTypeMeta = TCharacterTypeMetaMatchFlags & {
	commandDescriptor?: string;
	pluralDescriptor?: string;
	singularDescriptor?: string;
};

export function getCharacterTypeMeta(command: Command, matchFlags = getCharacterTypeMetaMatchFlags(command)): TCharacterTypeMeta {
	debug(matchFlags);
	const getDescriptor = (values: string[]) => {
		if (matchFlags.isCompanion) return values[0];
		if (matchFlags.isPc) return values[1];
		if (matchFlags.isNpc) return values[2];
		if (matchFlags.isGm) return values[3];
		if (matchFlags.isMinion) return values[4];
		return undefined;
	};
	const { isCompanion, isCompanionOrMinion, isGm, isGmOrNpcOrMinion, isMinion, isNpc, isPc, isPcOrCompanion } = matchFlags;
	return {
		isCompanion, isCompanionOrMinion, isGm, isGmOrNpcOrMinion, isMinion, isNpc, isPc, isPcOrCompanion,
		commandDescriptor: getDescriptor(["companion", "playerCharacter", "nonPlayerCharacter", "gameMaster", "minion"]),
		pluralDescriptor: getDescriptor(["Companions", "Player Characters", "Non-Player Characters", "Game Masters", "Minions"]),
		singularDescriptor: getDescriptor(["Companion", "Player Character", "Non-Player Character", "Game Master", "Minion"]),
	};
}
