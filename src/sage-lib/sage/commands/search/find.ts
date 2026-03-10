import { ArgsManager } from "@rsc-utils/core-utils";
import { registerMessageListener } from "../../../discord/handlers.js";
import type { TCommandAndArgs } from "../../../discord/types.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { searchHandler } from "./search.js";

/** Checks searchText to see if the entire string is an object type, or an object type followed by "by source"; if so it lists all items of the given objectType */
// async function repositoryFind_listObjectType(sageMessage: SageMessage, searchInfo: TParsedSearchInfo): Promise<boolean> {
// 	if (searchInfo.objectTypes.length) return false;

// 	const bySourceMatch = searchInfo.searchText.match(/\s*(\w+)\s*by\s*source\s*/i);
// 	const bySource = bySourceMatch !== null;
// 	const objectType = bySource && bySourceMatch[1] || searchInfo.searchText;
// 	const usObjectType = oneToUS(objectType.replace(/^gods?$/i, "deity"));
// 	const pluralObjectType = Repository.parseObjectType(usObjectType);
// 	if (pluralObjectType) {
// 		const renderables = renderAll(pluralObjectType.objectType, pluralObjectType.objectTypePlural, bySource);
// 		for (const renderableContent of renderables) {
// 			await sageMessage.send(renderableContent);
// 		}
// 		return true;
// 	}
// 	return false;
// }

/** Checks searchText for the word table, then checks to see if the rest of the text is a table name; if so, renders table */
// async function repositoryFindRenderTable(sageMessage: SageMessage): Promise<boolean> {
// 	const searchText = sageMessage.args.join(" ");
// 	const tableName = searchText.match(/\btable\b/i) && searchText.replace(/\btable\b/i, "") || "";
// 	const table = Repository.findByValue("Table", tableName);
// 	if (table) {
// 		await sageMessage.send(table);
// 		return true;
// 	}
// 	return false;
// }

const FindTextRegExp = /^\?!\s*\w+/;
function findTester(sageMessage: SageMessage): TCommandAndArgs | null {
	const slicedContent = sageMessage.slicedContent;
	if (sageMessage.hasPrefix && FindTextRegExp.test(slicedContent)) {
		return {
			command: "find",
			args: ArgsManager.from(slicedContent.slice(2))
		};
	}
	return null;
}

async function findHandler(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowCommand) {
		return sageMessage.reactBlock();
	}

	// if (await repositoryFind_listObjectType(sageMessage, parsedSearchInfo)) return;
	// if (await repositoryFindRenderTable(sageMessage)) {
	// 	return Promise.resolve();
	// }
	return searchHandler(sageMessage, true);
}

export function registerFind(): void {
	registerMessageListener(findTester, findHandler);
}
