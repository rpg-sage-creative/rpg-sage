import SageMessage from "../../../model/SageMessage";

type TCharacterTypeMetaMatchFlags = {
	isCompanion: boolean;
	isGm: boolean;
	isMinion: boolean;
	isMy: boolean;
	isNpc: boolean;
	isPc: boolean;
};

export type TCharacterTypeMeta = TCharacterTypeMetaMatchFlags & {
	commandDescriptor?: string;
	isGmOrNpcOrMinion: boolean;
	isPcOrCompanion: boolean;
	pluralDescriptor?: string;
	singularDescriptor?: string;
};

function getCharacterTypeMetaMatchFlags(sageMessage: SageMessage): TCharacterTypeMetaMatchFlags {
	return {
		isCompanion: sageMessage.commandMatches(/^(my-?)?(companion|alt|familiar)/i),
		isGm: sageMessage.commandMatches(/^(my-?)?(gm|gamemaster)/i),
		isMinion: sageMessage.commandMatches(/^(my-?)?(minion)/i),
		isMy: sageMessage.commandMatches(/^my/i),
		isNpc: sageMessage.commandMatches(/^(my-?)?(npc|nonplayercharacter)/i),
		isPc: sageMessage.commandMatches(/^(my-?)?(pc|playercharacter)/i)
	};
}

function getCharacterTypeMetaText(matchFlags: TCharacterTypeMetaMatchFlags, values: string[]): string | undefined {
	if (matchFlags.isCompanion) {
		return values[0];
	}else if (matchFlags.isPc) {
		return values[1];
	}else if (matchFlags.isNpc) {
		return values[2];
	}else if (matchFlags.isGm) {
		return values[3];
	}else if (matchFlags.isMinion) {
		return values[4];
	}else {
		return undefined;
	}
}

export function getCharacterTypeMeta(sageMessage: SageMessage): TCharacterTypeMeta {
	const matchFlags = getCharacterTypeMetaMatchFlags(sageMessage);
	return {
		commandDescriptor: getCharacterTypeMetaText(matchFlags, ["companion", "playerCharacter", "nonPlayerCharacter", "gameMaster", "minion"]),
		isGmOrNpcOrMinion: matchFlags.isGm || matchFlags.isNpc || matchFlags.isMinion,
		isPcOrCompanion: matchFlags.isPc || matchFlags.isCompanion,
		pluralDescriptor: getCharacterTypeMetaText(matchFlags, ["Companions", "Player Characters", "Non-Player Characters", "Game Masters", "Minions"]),
		singularDescriptor: getCharacterTypeMetaText(matchFlags, ["Companion", "Player Character", "Non-Player Character", "Game Master", "Minion"]),
		...matchFlags
	};
}
