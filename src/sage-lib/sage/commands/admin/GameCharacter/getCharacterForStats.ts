import type { Snowflake } from "discord.js";
import type { Names } from "../../../model/SageCommandArgs.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharacter } from "./getCharacter.js";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta.js";

export async function getCharacterForStats(sageMessage: SageMessage, characterTypeMeta: TCharacterTypeMeta, userDid: Snowflake, names: Names) {
	const { name } = names;
	if (!name) {
		return null;
	}

	const game = sageMessage.game;
	if (game) {
		const encounters = game.encounters.all;
		for (const encounter of encounters) {
			if (encounter.active) {
				const char = encounter.getCharShell(name);
				if (char) {
					return char.game ?? null;
				}
			}
		}

		const parties = game.parties.all;
		for (const party of parties) {
			const char = party.getCharShell(name);
			if (char) {
				return char.game ?? null;
			}
		}
	}

	return getCharacter(sageMessage, characterTypeMeta, userDid, names);
}