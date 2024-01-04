import type SageMessage from "../../model/SageMessage";
import type { DialogContent } from "./DialogContent";
import { parseDialogContent } from "./parseDialogContent";

export function updateAliasDialogArgsAndReturnType(sageMessage: SageMessage, dialogContent: DialogContent): DialogContent | null {
	const aliasFound = sageMessage.findAlias(dialogContent.alias);
	if (!aliasFound) {
		return null;
	}

	const aliasContent = parseDialogContent(aliasFound.target)!;
	const textRegex = /{text}/i;
	const _content = (aliasContent.content ?? "").replace(/\\n/g, "<br/>");
	const updatedContent = textRegex.test(_content)
		? _content.replace(textRegex, dialogContent.content)
		: _content + dialogContent.content;

	return {
		type: aliasContent.type,
		// alias: undefined,
		// who: undefined,
		attachment: dialogContent.attachment ?? aliasContent.attachment,
		postType: dialogContent.postType ?? aliasContent.postType,
		name: dialogContent.who ?? aliasContent.name,
		displayName: aliasContent.displayName,
		title: dialogContent.title ?? aliasContent.title,
		imageUrl: dialogContent.imageUrl ?? aliasContent.imageUrl,
		embedColor: dialogContent.embedColor ?? aliasContent.embedColor,
		content: updatedContent
	};
}