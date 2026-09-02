import { DataTable } from "@rsc-sage/data-layer";
import { isNonNilSnowflake, isNonNilUuid, type Optional } from "@rsc-utils/core-utils";

type ImportCharacterType = "e20" | "heph" | "pb2e";

export type ParsedCustomId<ValidCommand extends string = string> = {
	characterId: string;
	characterType: ImportCharacterType;
	command: ValidCommand;
	deprecated?: boolean;
	tool: "ImportCharSheet";
};

/**
 * Attempts to parse the given customId ("prefix|characterId|command") into a ParsedCustomId object.
 * It must have the correct prefix, a valid snowflake/uuid, and a valid command.
 * Some really old sheets might be missing the prefix and are tagged "deprecated" to be rebuilt.
 * We pass validCommands in to make maintenance easier for each characterType.
 */
function parseCustomId(
	characterType: ImportCharacterType,
	validCommands: readonly string[],
	customId: Optional<string>,
): ParsedCustomId | undefined {

	// require customId
	if (!customId) {
		return undefined;
	}

	let deprecated = false;

	// handle prefix and deprecated by characterType
	switch(characterType) {
		case "e20": {
			// must have matching prefix
			if (!customId.startsWith("E20|")) {
				return undefined;
			}
			break;
		}
		case "heph": {
			// must have matching prefix
			if (!customId.startsWith("HEPH1E|")) {
				return undefined;
			}
			break;
		}
		case "pb2e": {
			// disqualify other sheets (due to original/deprecated pb2e sheets not having prefix)
			if (customId.startsWith("E20|") || customId.startsWith("HEPH1E|")) {
				return undefined;
			}

			// missing prefix @todo deprecate this and force old sheets to refresh
			deprecated = !customId.startsWith("PB2E|");
			break;
		}
		default: {
			return undefined;
		}
	}

	// split remaining parts (deprecated has no prefix to slice off)
	const [characterId, command] = deprecated
		? customId.split("|")
		: customId.split("|").slice(1);

	// validate command first (quicker than id validation)
	if (!validCommands.includes(command)) {
		return undefined;
	}

	// validate id
	if (!isNonNilSnowflake(characterId) && !isNonNilUuid(characterId)) {
		return undefined;
	}

	return {
		characterId,
		characterType,
		command,
		tool: "ImportCharSheet",
	};
}

/**
 * Attempts to parse the given customId ("prefix|characterId|command") into a ParsedCustomId object.
 * This is done by calling parseCustomId().
 * If successful, then the characterId is validated to ensure the character exists.
 */
export async function parseImportCharacterSheetCustomId<
	ValidCommand extends string = string,
>(
	characterType: ImportCharacterType,
	validCommands: readonly ValidCommand[],
	customId: Optional<string>,
): Promise<ParsedCustomId<ValidCommand> | undefined> {

	const parsed = parseCustomId(characterType, validCommands, customId);
	if (!parsed) {
		return undefined;
	}

	const exists = await DataTable.characterImportExists(parsed.characterType, parsed.characterId);
	return exists
		? parsed as ParsedCustomId<ValidCommand>
		: undefined;
}
