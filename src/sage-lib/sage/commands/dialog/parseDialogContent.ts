import { capitalize } from "../../../../sage-utils/utils/StringUtils";
import { DialogType } from "../../repo/base/IdRepository";
import type { DialogContent } from "./DialogContent";
import { getTypeOrAlias } from "./getTypeOrAlias";
import { getDialogRegexPairs, type DialogRegexKey } from "./regex";

/** Parses raw dialog input. */
export function parseDialogContent(content: string): DialogContent | null {
	// make sure we have a valid start
	const typeOrAlias = getTypeOrAlias(content);
	if (!typeOrAlias) {
		return null;
	}

	const regexPairs = getDialogRegexPairs();

	const matchPair = (value: string) => {
		for (const pair of regexPairs) {
			const match = pair.regex.exec(value);
			if (match) {
				const key = pair.key as any;
				const value = match[1];
				const values = match.slice(1);
				// .length - 2 to leave :: at the beginning of the string
				const sliceLength = match[0].length - 2;
				return { key, value, values, sliceLength };
			}
		}
		return null;
	};

	const dialogContent: DialogContent = {
		type: typeOrAlias.type,
		alias: typeOrAlias.alias,
		// .length - 2 to leave :: at the beginning of the string
		content: content.slice(typeOrAlias.length - 2)
	};

	let match: { key:DialogRegexKey; values:string[]; value:string; sliceLength:number; } | null;
	while (match = matchPair(dialogContent.content)) {
		let breakWhile = false;
		switch(match.key) {
			case "postType": {
				if (dialogContent.postType === undefined) {
					dialogContent.postType = DialogType[capitalize(match.value) as keyof typeof DialogType];
				}else {
					breakWhile = true;
				}
				break;
			}
			case "nameAndDisplayName": {
				if (!dialogContent.name && !dialogContent.displayName) {
					dialogContent.name = match.values[0];
					dialogContent.displayName = match.values[1];
				}else {
					breakWhile = true;
				}
				break;
			}
			case "displayName": {
				if (!dialogContent.displayName) {
					dialogContent.displayName = match.value;
				}else {
					breakWhile = true;
				}
				break;
			}
			case "embedColor": {
				if (!dialogContent.embedColor) {
					dialogContent.embedColor = match.value;
				}else {
					breakWhile = true;
				}
				break;
			}
			case "url": {
				if (!dialogContent.imageUrl) {
					dialogContent.imageUrl = match.value.startsWith("<") && match.value.endsWith(">")
						? match.value.slice(1, -1)
						: match.value;
				}else {
					breakWhile = true;
				}
				break;
			}
			default: {
				if (/^attachment$/i.test(match.value) && dialogContent.attachment !== true) {
					dialogContent.attachment = true;
				}else if (!dialogContent.name) {
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

		// remove the arg we just found
		dialogContent.content = dialogContent.content.slice(match.sliceLength);
	}

	// remove the leading ::
	dialogContent.content = dialogContent.content.slice(2).trim();

	return dialogContent;
}