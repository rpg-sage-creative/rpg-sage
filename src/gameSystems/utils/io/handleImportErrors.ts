import { debug } from "@rsc-utils/core-utils";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";

export type FetchResultError = "INVALID_ID" | "INVALID_EXISTING_ID"
	| "INVALID_NAME" | "NAME_MISMATCH"
	| "INVALID_JSON_URL" | "INVALID_JSON_ATTACHMENT" | "INVALID_JSON" | "UNSUPPORTED_JSON"
	| "INVALID_PDF_URL" | "INVALID_PDF_ATTACHMENT" | "INVALID_PDF" | "UNSUPPORTED_PDF"
	| "NOTHING_TO_IMPORT";

export type CanHaveFetchResultError = { error?: FetchResultError; };

function toHumanReadable(error: FetchResultError, action: "Import" | "Reimport"): string {
	switch (error) {
		case "NOTHING_TO_IMPORT": return `Nothing to ${action.toLowerCase()}.`;
		case "INVALID_ID": return "The given ID is invalid.";
		case "INVALID_NAME": return `Due to Discord policy, you cannot have "discord" in the name.`;
		case "NAME_MISMATCH": return `Character names don't match.`;
		case "INVALID_JSON_ATTACHMENT": return "The attached JSON is invalid.";
		case "INVALID_JSON_URL": return "The given JSON url is invalid.";
		case "INVALID_JSON": return "The given JSON is invalid.";
		case "UNSUPPORTED_JSON": return "The given JSON is unsupported.";
		case "INVALID_PDF_ATTACHMENT": return "The attached PDF is invalid.";
		case "INVALID_PDF_URL": return "The given PDF url is invalid.";
		case "INVALID_PDF": return "The given PDF is invalid.";
		case "UNSUPPORTED_PDF": return "The given PDF is unsupported.";
		default: debug({error}); return "Sorry, we don't know what went wrong!";
	}
}

/** Returns true if an error message was sent to the user. */
export async function handleImportErrors(sageCommand: SageCommand, fetchResults: CanHaveFetchResultError[], action: "Import" | "Reimport"): Promise<void> {
	if (!fetchResults.length) {
		fetchResults.push({ error:"NOTHING_TO_IMPORT" });
	}

	const errorMessages = fetchResults
		.filter(fetchResult => fetchResult?.error)
		.map(fetchResult => toHumanReadable(fetchResult.error!, action));

	if (errorMessages.length) {
		const content = [`${action} Error!`];
		content.push(...errorMessages);
		content.push(`\nFor information on importing characters, see our [wiki](<https://github.com/rpg-sage-creative/rpg-sage/wiki/Character-Management#importing-characters>)`);
		await sageCommand.replyStack.whisper(content.join("\n"));
		await sageCommand.replyStack.stopThinking();
	}
}