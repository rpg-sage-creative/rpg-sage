import type { Optional } from "@rsc-utils/type-utils";
import type { Snowflake } from "discord.js";
import { NilSnowflake } from "../../../../discord";
import type CharacterManager from "../../../model/CharacterManager";
import type GameCharacter from "../../../model/GameCharacter";
import type { TNames } from "../../../model/SageMessageArgsManager";

export function findCompanion(characterManager: CharacterManager, userDid: Optional<Snowflake>, names: TNames): GameCharacter | undefined {
	const character = names.charName
		? characterManager.findByUserAndName(userDid, names.charName)
		: characterManager.filterByUser(userDid ?? NilSnowflake)?.[0];
	if (!character) {
		return undefined;
	}

	return names.name
		? character.companions.findByName(names.name)
		: character.companions[0] ?? undefined;
}