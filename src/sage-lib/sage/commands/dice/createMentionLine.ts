import type { SageCommand } from "../../model/SageCommand";
import { createAuthorMention } from "./createAuthorMention.js";
import { createGmMention } from "./createGmMention.js";

/**
 * Creates the mention line of a dice roll message.
 * The GM is always tagged first.
 * If the roll belongs to a player, then they are tagged second.
 */
export async function createMentionLine(sageCommand: SageCommand, isSecretMention = false/*, hasSecret:boolean, isTargetChannel: boolean, isGmChannel: boolean, isGmUser: boolean*/): Promise<string | null> {
	// start with the gm mention
	const gmMention = createGmMention(sageCommand);

	// if the roller is the GM, return the mention
	if (sageCommand.isGameMaster) {
		return gmMention;
	}

	// get an author mention (for a non-gm)
	const authorMention = await createAuthorMention(sageCommand, isSecretMention);

	// if we have a gm mention let's combine them with a comma
	if (gmMention) {
		return `${gmMention}, ${authorMention}`;
	}

	// return just the author mention
	return authorMention;
}