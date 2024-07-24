import { orNilSnowflake, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { type CharacterManager } from "../../../model/CharacterManager.js";
import { type GameCharacter } from "../../../model/GameCharacter.js";
import { type Names } from "../../../model/SageCommandArgs.js";

export function findCompanion(characterManager: CharacterManager, userDid: Optional<Snowflake>, names: Names): GameCharacter | undefined {
	const character = names.charName
		? characterManager.findByUserAndName(userDid, names.charName)
		: characterManager.filterByUser(orNilSnowflake(userDid))?.[0];
	if (!character) {
		return undefined;
	}

	return names.name
		? character.companions.findByName(names.name)
		: character.companions[0] ?? undefined;
}