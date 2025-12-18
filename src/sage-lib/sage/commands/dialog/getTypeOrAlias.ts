import { matchDialogType } from "./matchDialogType.js";
import { DialogTypeOrAliasRegExp } from "./regex.js";

export function getTypeOrAlias(content: string) {
	// make sure we have a valid start
	const typeOrAliasMatch = DialogTypeOrAliasRegExp.exec(content);
	if (!typeOrAliasMatch) {
		return null;
	}

	// get type or alias
	const typeOrAlias = typeOrAliasMatch[1];
	const type = matchDialogType(typeOrAlias);
	const alias = !type ? typeOrAlias : undefined;

	// get length of type or alias plus two semicolons
	const length = typeOrAliasMatch[0].length;

	return { type, alias, length };
}