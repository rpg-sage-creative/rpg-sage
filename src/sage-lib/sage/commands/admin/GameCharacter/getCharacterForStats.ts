import type { Snowflake } from "discord.js";
import type SageMessage from "../../../model/SageMessage";
import type { TNames } from "../../../model/SageMessageArgsManager";
import { getCharacter } from "./getCharacter";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta";

export async function getCharacterForStats(sageMessage: SageMessage, characterTypeMeta: TCharacterTypeMeta, userDid: Snowflake, names: TNames) {
	const { name } = names;
	if (!name) {
		return null;
	}

	const game = sageMessage.game;
	if (!game) {
		return getCharacter(sageMessage, characterTypeMeta, userDid, names);
	}

	const encounters = game.encounters.all;
	for (const encounter of encounters) {
		if (encounter.active) {
			const char = encounter.getCharPair(name);
			if (char) {
				return char.game ?? null;
			}
		}
	}

	const parties = game.parties.all;
	for (const party of parties) {
		const char = party.getCharPair(name);
		if (char) {
			return char.game ?? null;
		}
	}

	return null;
}