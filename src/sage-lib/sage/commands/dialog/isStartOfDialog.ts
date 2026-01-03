import { getTypeOrAlias } from "@rsc-utils/game-utils";
import type { SageCommand } from "../../model/SageCommand.js";
import { findAlias } from "./find/findAlias.js";

/**
 * Checks the content to ensure it starts with the proper dialog prefix.
 * If the prefix is an alias and not a type, it checks that the alias is valid.
 */
export function isStartOfDialog(sageCommand: SageCommand, content: string): boolean {
	const typeOrAlias = getTypeOrAlias(content);

	// nothing to find
	if (!typeOrAlias) return false;

	// we already have the type
	if (typeOrAlias.type) return true;

	// go find it
	return findAlias(sageCommand, typeOrAlias.alias) !== undefined;
}