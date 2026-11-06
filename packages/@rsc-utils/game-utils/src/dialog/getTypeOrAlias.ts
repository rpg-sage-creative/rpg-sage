import type { Optional } from "@rsc-utils/type-utils";
import { OptionalHorizontalWhitespaceRegExp as HWS } from "@rsc-utils/whitespace-string-utils";
import { regex } from "regex";
import type { DialogType } from "./DialogType.js";
import { matchDialogType } from "./matchDialogType.js";

export const DialogTypeOrAliasRegExp = regex`
	^
	${HWS}
	(?<alias>
		[ \w \p{L} \p{N} ]+   # letters, numbers, and underscores only
	)
	${HWS}
	::
`;

type TypeOrAlias = {
	type?: DialogType | undefined;
	alias?: string | undefined;
	length: number;
};

export function getTypeOrAlias(content: Optional<string>): TypeOrAlias | undefined {
	if (!content) {
		return undefined;
	}

	// make sure we have a valid start
	const typeOrAliasMatch = DialogTypeOrAliasRegExp.exec(content);
	if (!typeOrAliasMatch) {
		return undefined;
	}

	// get type or alias
	const typeOrAlias = typeOrAliasMatch[1];
	const type = matchDialogType(typeOrAlias);
	const alias = !type ? typeOrAlias : undefined;

	// get length of type or alias plus two semicolons
	const length = typeOrAliasMatch[0].length;

	return { type, alias, length };
}