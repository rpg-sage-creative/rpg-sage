import { capitalize, parseHexColor } from "@rsc-utils/core-utils";
import { unwrapUrl } from "../utils/unwrapUrl.js";
import type { DialogContent } from "./DialogContent.js";
import { DialogPostType } from "./DialogPostType.js";
import { getTypeOrAlias } from "./getTypeOrAlias.js";
import { matchDialogRegexPair, type DialogRegExpMatch } from "./matchDialogRegexPair.js";

/** Parses raw dialog input. */
export function parseDialogContent(content: string): DialogContent | undefined {
	// make sure we have a valid start
	const typeOrAlias = getTypeOrAlias(content);
	if (!typeOrAlias) {
		return undefined;
	}

	const dialogContent: DialogContent = {
		type: typeOrAlias.type,
		alias: typeOrAlias.alias,
		// .length - 2 to leave :: at the beginning of the string
		content: content.slice(typeOrAlias.length - 2)
	};

	let match: DialogRegExpMatch | undefined;
	while (match = matchDialogRegexPair(dialogContent.content)) {
		// if we hit a duplicated section we stop processing sections
		let breakWhile = false;

		switch(match.key) {

			case "postType": {
				if (dialogContent.postType === undefined) {
					// set only if we haven't set postType yet
					dialogContent.postType = DialogPostType[capitalize(match.value) as keyof typeof DialogPostType];
				}else {
					breakWhile = true;
				}
				break;
			}

			case "nameAndDisplayName": {
				if (!dialogContent.name && !dialogContent.displayName) {
					// we only set if both name and displayName aren't set yet
					dialogContent.name = match.values[0];
					dialogContent.displayName = match.values[1];
				}else {
					breakWhile = true;
				}
				break;
			}

			case "displayName": {
				if (!dialogContent.displayName) {
					// set if we don't have a displayName
					dialogContent.displayName = match.value;
				}else if (dialogContent.name && dialogContent.displayName) {
					// if we have name but not displayName, combine them
					dialogContent.name = `${dialogContent.name} (${dialogContent.displayName})`;
					dialogContent.displayName = match.value;
				}else {
					breakWhile = true;
				}
				break;
			}

			case "embedColor": {
				if (!dialogContent.embedColor) {
					// set only if we haven't set embedColor yet
					dialogContent.embedColor = parseHexColor(match.value);
				}else {
					breakWhile = true;
				}
				break;
			}

			case "url": case "embedImageUrl": {
				if (!dialogContent.embedImageUrl) {
					// set only if we haven't set embedImageUrl yet
					dialogContent.embedImageUrl = unwrapUrl(match.value);
				}else {
					breakWhile = true;
				}
				break;
			}

			case "dialogImageUrl": {
				if (!dialogContent.dialogImageUrl) {
					// set only if we haven't set dialogImageUrl yet
					dialogContent.dialogImageUrl = unwrapUrl(match.value);
				}else {
					breakWhile = true;
				}
				break;
			}

			default: {
				if (match.value?.toLowerCase() === "attachment" && dialogContent.attachment !== true) {
					// if section is only attachment and we haven't set it yet, set it
					dialogContent.attachment = true;
				}else if (!dialogContent.name) {
					// if we don't have a name, we use the first section that isn't accounted for as the name
					dialogContent.name = match.value;
				}else {
					breakWhile = true;
				}
				break;
			}
		}

		// we are done with parsing dailog args
		if (breakWhile) {
			break;
		}

		// remove the arg/section we just found
		dialogContent.content = dialogContent.content.slice(match.sliceLength);
	}

	// remove the leading ::
	dialogContent.content = dialogContent.content.slice(2).trim();

	return dialogContent;
}