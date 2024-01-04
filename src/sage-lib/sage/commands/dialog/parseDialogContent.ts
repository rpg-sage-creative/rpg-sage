import { debug } from "../../../../sage-utils/utils/ConsoleUtils";
import { capitalize } from "../../../../sage-utils/utils/StringUtils";
import { DialogType } from "../../repo/base/IdRepository";
import type { DialogContent } from "./DialogContent";
import { getTypeOrAlias } from "./getTypeOrAlias";
import { getDialogRegexPairs, type DialogRegexKey } from "./regex";

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
				const sliceLength = match[0].length - 2;
				return { key, value, values, sliceLength };
			}
		}
		return null;
	};

	const dialogContent: DialogContent = {
		type: typeOrAlias.type,
		alias: typeOrAlias.alias,
		content: content.slice(typeOrAlias.length + 2)
	};

	let match: { key:DialogRegexKey; values:string[]; value:string; sliceLength:number; } | null;
	while (match = matchPair(dialogContent.content)) {
		let breakWhile = false;
		switch(match.key) {
			case "who":
				dialogContent.who = match.value;
				break;

			case "postType":
				dialogContent.postType = DialogType[capitalize(match.value) as keyof typeof DialogType];
				break;

			case "names":
				dialogContent.name = match.values[0];
				dialogContent.displayName = match.values[1];
				break;

			case "title":
				dialogContent.title = match.value;
				break;

			case "embedColor":
				dialogContent.embedColor = match.value;
				break;

			case "url":
				dialogContent.imageUrl = match.value;
				break;

			default: {
				if (/^attachment$/i.test(match.value) && dialogContent.attachment !== true) {
					dialogContent.attachment = true;
				}else if (!dialogContent.name) {
					dialogContent.name = match.value;
				}else {
					breakWhile = true;
				}
			}
		}

		// we are done with parsing dailog args
		if (breakWhile) {
			break;
		}

		// remove the arg we just found
		dialogContent.content = dialogContent.content.slice(match.sliceLength);
	}

	if (content.includes("`")) {
		debug({content,dialogContent});
	}

	return dialogContent;
}