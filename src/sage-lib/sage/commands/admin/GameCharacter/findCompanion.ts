import { type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { type CharacterManager } from "../../../model/CharacterManager.js";
import { type GameCharacter } from "../../../model/GameCharacter.js";
import { type Names } from "../../../model/SageCommandArgs.js";

/**
 * Returns the named companion of the named character.
 * If a userId is given, the character/companion must be for that user.
 * If no charName is given, the first character
 */
export function findCompanion(characterManager: CharacterManager, userId: Optional<Snowflake>, names: Names): GameCharacter | undefined {
	// try the built in function first
	let companion = characterManager.findCompanion(userId, names.charName, names.name);

	if (!companion) {

		let character: GameCharacter | undefined;

		if (names.charName) {
			// find character by name
			character = characterManager.findByUser(userId, names.charName);

		}else if (userId) {
			// grab first char for the given user
			character = characterManager.filterByUser(userId)[0];
		}

		if (character) {
			if (names.name) {
				// grab the companion by name
				companion = character.companions.findByName(names.name);

			}else {
				// grab the first companion for the character
				companion = character.companions[0];
			}
		}

	}

	return companion;
}