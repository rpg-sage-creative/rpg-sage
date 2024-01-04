import { getCodeBlockSafeSplitter } from "../../../../sage-utils/utils/StringUtils";
import type { DialogContent } from "./DialogContent";
import { parseDialogContent } from "./parseDialogContent";
import { getDialogTypeOrAliasRegex } from "./regex";

export function parseDialogContents(content: string): DialogContent[] {
	const typeRegex = getDialogTypeOrAliasRegex();

	const lines = content.split(getCodeBlockSafeSplitter());

	const dialogLines = lines.reduce((dLines, line) => {
		if (!dLines.length || typeRegex.test(line)) {
			dLines.push(line);
		}else {
			dLines[dLines.length - 1] += `\n${line}`;
		}
		return dLines;
	}, [] as string[]);

	return dialogLines
		.map(lineContent => parseDialogContent(lineContent))
		.filter(d => d?.content) as DialogContent[];
}
