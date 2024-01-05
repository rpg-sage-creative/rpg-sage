import type SageMessage from "../../model/SageMessage";
import type { DialogContent } from "./DialogContent";
import { parseDialogContent } from "./parseDialogContent";

export function updateAliasDialogArgsAndReturnType(sageMessage: SageMessage, dialogContent: DialogContent): DialogContent | null {
	const aliasFound = sageMessage.findAlias(dialogContent.alias);
	if (!aliasFound) {
		return null;
	}

	const aliasContent = parseDialogContent(aliasFound.target)!;

	const updatedAliasContent = (aliasContent.content ?? "")
		.replace(/\\n/g, "<br/>");

	const textRegex = /{text}/i;
	const updatedContent = textRegex.test(updatedAliasContent)
		? updatedAliasContent.replace(textRegex, dialogContent.content)
		: updatedAliasContent + dialogContent.content;

	return {
		type: aliasContent.type,
		// alias: undefined,
		attachment: dialogContent.attachment ?? aliasContent.attachment,
		postType: dialogContent.postType ?? aliasContent.postType,
		name: dialogContent.name ?? aliasContent.name,
		displayName: dialogContent.displayName ?? aliasContent.displayName,
		imageUrl: dialogContent.imageUrl ?? aliasContent.imageUrl,
		embedColor: dialogContent.embedColor ?? aliasContent.embedColor,
		content: updatedContent
	};
}