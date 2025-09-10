import type { SageCommand } from "../../model/SageCommand.js";
import type { DialogContent } from "./DialogContent.js";
import { findAlias } from "./find/findAlias.js";
import { parseDialogContent } from "./parseDialogContent.js";

/**
 * Parses dialog content.
 * If an alias is found, it ensures the alias is valid and updates the dialog content to use it.
 */
export function parseUsableDialogContent(sageCommand: SageCommand, content: string): DialogContent | undefined {
	// parse original content
	const dialogContent = parseDialogContent(content);
	// we can't parse it or don't have an alias, so return now
	if (!dialogContent?.alias) {
		return dialogContent;
	}

	// look up the alias
	const aliasFound = findAlias(sageCommand, dialogContent.alias);
	// we can't find it, so return now
	if (!aliasFound) {
		return undefined;
	}

	// .charAlias implies a dynamic alias on the character (using alias property) instead of a user advanced alias (alias macro)
	if (aliasFound.charAlias) {
		// slice off the input after the alias::
		const index = content.indexOf("::");
		const slicedDialogContent = content.slice(index + 2);
		// parse and return the updated content
		return parseDialogContent(aliasFound.target + slicedDialogContent);
	}

	const aliasContent = parseDialogContent(aliasFound.target);
	// just in case it doesn't parse, return now
	if (!aliasContent) {
		return undefined;
	}

	// properly update the content by either replacing {text} or appending
	const textRegex = /{text}/i;
	const updatedContent = textRegex.test(aliasContent.content)
		? aliasContent.content.replace(textRegex, dialogContent.content)
		: aliasContent.content + dialogContent.content;

	return {
		type: aliasContent.type,
		// alias: undefined,
		attachment: dialogContent.attachment ?? aliasContent.attachment,
		postType: dialogContent.postType ?? aliasContent.postType,
		name: dialogContent.name ?? aliasContent.name,
		displayName: dialogContent.displayName ?? aliasContent.displayName,
		embedColor: dialogContent.embedColor ?? aliasContent.embedColor,
		embedImageUrl: dialogContent.embedImageUrl ?? aliasContent.embedImageUrl,
		dialogImageUrl: dialogContent.dialogImageUrl ?? aliasContent.dialogImageUrl,
		content: updatedContent
	};
}