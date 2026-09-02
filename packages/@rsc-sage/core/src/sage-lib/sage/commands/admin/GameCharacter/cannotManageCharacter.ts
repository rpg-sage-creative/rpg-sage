import type { LocalizedTextKey } from "@rsc-sage/localization";
import { error, tagLiterals } from "@rsc-utils/core-utils";
import type { CharacterShell } from "../../../model/CharacterShell.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { TCharacterTypeMeta } from "./getCharacterTypeMeta.js";

/**
 * This attempts to determine if the character of the companion/minion we are editing is the GM Character.
 * We've made it a function for easier updating in the future without creating a mess in the rest of the logic.
 */
function isCharNameGm({ args }: SageCommand): boolean {
	return args.getNames().charName?.toLowerCase() === "gm";
}

type ActionType = "CREATE" | "UPDATE" | "DELETE" | "DETAILS" | "LIST" | "IMPORT" | "EXPORT" | "AUTO";

type CanManageCharacterResults = {
	canManage: true;
	errorKey?: never;
} | {
	canManage?: never;
	errorKey: LocalizedTextKey;
};

function testCanManageCharacter(
	/** the command managing the character */
	sageCommand: SageCommand,
	/** the metadata about the character */
	characterTypeMeta: TCharacterTypeMeta,
	/** we allow admins to help players with some setup, such as auto dialog */
	action: ActionType,
	/** character to be managed */
	character?: GameCharacter | CharacterShell,
): CanManageCharacterResults {

	const {
		actor: { isGameMaster, isGamePlayer },
		actorId,
		allowCommand,
		canAdminGames,
		game,
		server
	} = sageCommand;

	// if the channel doesn't allow commands, stop the madness here
	if (!allowCommand) {
		return { errorKey:"CANNOT_MANAGE_CHARACTERS_HERE" };
	}

	// a game master can do it all
	if (isGameMaster) {
		return { canManage:true };
	}

	// if the character belongs to the user, let them do anything
	if (character?.userId === actorId) {
		return { canManage:true };
	}

	// if the actor is a trusted user, let them do anything
	if (game?.getTrustedPlayers(character)?.includes(actorId)) {
		return { canManage:true };
	}

	// we want to allow admins the ability to help players setup their auto dialog
	if (canAdminGames && action === "AUTO") {
		return { canManage:true };
	}

	const {
		isGm,
		isMinion,
		isNpc,
		isPcOrCompanion
	} = characterTypeMeta;

	// GM characters are only for gms and admins
	if (isGm || (isMinion && isCharNameGm(sageCommand))) {

		// we don't allow this ... currently
		if (action === "EXPORT") {
			return { errorKey:"CANNOT_EXPORT_GM" };
		}

		// Game takes precedence over Server
		if (game) {

			// isGameMaster already validated

			// we allow admins to help setup a game; such as renaming the GM character
			if (canAdminGames && action === "UPDATE") {
				return { canManage:true };
			}

			return { errorKey:"CANNOT_MANAGE_GAME_GM" };

		// use "else if" to make sure we only check server GM perms when no Game is present
		}else if (server) {

			if (canAdminGames) {
				return { canManage:true };
			}

			return { errorKey:"CANNOT_MANAGE_SERVER_GM" };

		}

		// this code should never be reached, but if we did somehow, let's err on the side of caution
		return { errorKey:"CANNOT_MANAGE_GM" };
	}

	// NPC / Minion characters can only be at Game level
	if (isNpc || isMinion) {

		if (game) {

			// isGameMaster already validated

			return { errorKey:"CANNOT_MANAGE_GAME_NPC" };
		}

		/** @todo: When we have NPCs outside of games ... return { canManage:true }; */
		return { errorKey:"NPC_ONLY_IN_GAME" };
	}

	// last, but not least
	if (isPcOrCompanion) {

		if (game) {

			// isGameMaster already validated

			// players can only edit their own PCs
			if (isGamePlayer) {

				// if we don't have a specific character, allow players leniency
				if (!character) {
					return { canManage:true };
				}

				// trusted users already validated
				return { errorKey:"CANNOT_MANAGE_OTHER_CHARACTERS" };
			}

			return { errorKey:"CANNOT_MANAGE_GAME_PC" };

		}

		// outside a Game anybody can manage their PCs
		return { canManage:true };
	}

	// this code should never be reached, but if we did somehow, let's err on the side of caution
	return { errorKey:"CANNOT_MANAGE_CHARACTERS" };
}

/**
 * Tests the character meta against the user to see if they are allowed to manage the character type.
 * If they are forbidden (cannotManage) then an appropriate message is sent to them as a reply/whisper and true is returned.
 * If they are allowed, then false is returned.
 * While a bit backwards, it allows for simple validation via:
 * - `if (await cannotManageCharacter(cmd, meta, action, char)) return;`
 */
export async function cannotManageCharacter(
	/** the command managing the character */
	sageCommand: SageCommand,
	/** the metadata about the character */
	characterTypeMeta: TCharacterTypeMeta,
	/** we allow admins to help players with some setup, such as auto dialog */
	action: ActionType,
	/** character to be managed */
	character?: GameCharacter | CharacterShell,
): Promise<boolean> {
	const { canManage, errorKey } = testCanManageCharacter(sageCommand, characterTypeMeta, action, character);
	if (canManage) {
		return false;
	}else if (errorKey) {
		await sageCommand.replyStack.whisper(sageCommand.getLocalizer()(errorKey));
	}else {
		error(tagLiterals`Invalid Results: testCanManageCharacter(sageCommand, ${characterTypeMeta}, ${action}, ${character?.name});`);
	}
	return true;
}