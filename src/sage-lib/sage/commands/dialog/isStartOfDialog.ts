import { SageMessage } from "../../model/SageMessage";
import { getTypeOrAlias } from "./getTypeOrAlias";

/**
 * Checks the content to ensure it starts with the proper dialog prefix.
 * If the prefix is an alias and not a type, it checks that the alias is valid.
 */
export function isStartOfDialog(sageMessage: SageMessage, content: string): boolean {
	const typeOrAlias = getTypeOrAlias(content);
	if (typeOrAlias) {
		if (typeOrAlias.type) {
			return true;
		}
		return !!sageMessage.findAlias(typeOrAlias.alias);
	}
	return false;
}