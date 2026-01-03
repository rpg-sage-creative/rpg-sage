import { getCodeBlockSafeSplitter } from "@rsc-utils/core-utils";
import type { DialogContent } from "@rsc-utils/game-utils";
import { SageMessage } from "../../model/SageMessage.js";
import { isStartOfDialog } from "./isStartOfDialog.js";
import { parseUsableDialogContent } from "./parseUsableDialogContent.js";

export function parseDialogContents(sageMessage: SageMessage, content: string): DialogContent[] {
	// let's require the post to start with dialog before we check for multi dialog
	if (!isStartOfDialog(sageMessage, content)) {
		return [];
	}

	const lines = content.split(getCodeBlockSafeSplitter());

	const dialogLines = lines.reduce((dLines, line) => {
		if (!dLines.length || isStartOfDialog(sageMessage, line)) {
			dLines.push(line);
		}else {
			dLines[dLines.length - 1] += `\n${line}`;
		}
		return dLines;
	}, [] as string[]);

	return dialogLines
		.map(lineContent => parseUsableDialogContent(sageMessage, lineContent))
		.filter(d => d?.content) as DialogContent[];
}
