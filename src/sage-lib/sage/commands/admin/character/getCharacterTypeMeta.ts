import { OrUndefined } from "../../../../../sage-utils";
import { SageMessage } from "../../../model/SageMessage";

type TCharacterTypeMetaMatchFlags = {
	isCompanion: boolean;
	isGm: boolean;
	isMy: boolean;
	isNpc: boolean;
	isPc: boolean;
};

export type TCharacterTypeMeta = TCharacterTypeMetaMatchFlags & {
	commandDescriptor?: string;
	isGmOrNpc: boolean;
	isPcOrCompanion: boolean;
	pluralDescriptor?: string;
	singularDescriptor?: string;
};

function getCharacterTypeMetaMatchFlags(sageMessage: SageMessage): TCharacterTypeMetaMatchFlags {
	const isCompanion = sageMessage.command.match(/^(my-?)?(companion|alt|familiar)/i) !== null;
	const isGm = sageMessage.command.match(/^(my-?)?(gm|gamemaster)/i) !== null;
	const isMy = sageMessage.command.match(/^my/i) !== null;
	const isNpc = sageMessage.command.match(/^(my-?)?(npc|nonplayercharacter)/i) !== null;
	const isPc = sageMessage.command.match(/^(my-?)?(pc|playercharacter)/i) !== null;
	return {
		isCompanion, isGm, isMy, isNpc, isPc
	};
}

function getCharacterTypeMetaText(matchFlags: TCharacterTypeMetaMatchFlags, values: string[]): OrUndefined<string> {
	if (matchFlags.isCompanion) {
		return values[0];
	}else if (matchFlags.isPc) {
		return values[1];
	}else if (matchFlags.isNpc) {
		return values[2];
	}else if (matchFlags.isGm) {
		return values[3];
	}else {
		return undefined;
	}
}

export function getCharacterTypeMeta(sageMessage: SageMessage): TCharacterTypeMeta {
	const matchFlags = getCharacterTypeMetaMatchFlags(sageMessage);
	return {
		commandDescriptor: getCharacterTypeMetaText(matchFlags, ["companion", "playerCharacter", "nonPlayerCharacter", "gameMaster"]),
		isGmOrNpc: matchFlags.isGm || matchFlags.isNpc,
		isPcOrCompanion: matchFlags.isPc || matchFlags.isCompanion,
		pluralDescriptor: getCharacterTypeMetaText(matchFlags, ["Companions", "Player Characters", "Non-Player Characters", "Game Masters"]),
		singularDescriptor: getCharacterTypeMetaText(matchFlags, ["Companion", "Player Character", "Non-Player Character", "Game Master"]),
		...matchFlags
	};
}
