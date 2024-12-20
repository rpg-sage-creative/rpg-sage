import { debug } from "@rsc-utils/core-utils";
import { hasLocalizedText } from "../../../sage-lang/getLocalizedText.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";

export type FetchResultError = "INVALID_ID" | "INVALID_EXISTING_ID"
	| "CHARACTER_NAME_MISMATCH"
	| "INVALID_JSON_URL" | "INVALID_JSON_ATTACHMENT" | "INVALID_JSON" | "UNSUPPORTED_JSON"
	| "INVALID_PDF_URL" | "INVALID_PDF_ATTACHMENT" | "INVALID_PDF" | "UNSUPPORTED_PDF"
	| "NOTHING_TO_IMPORT" | "NOTHING_TO_REIMPORT";

export type DiscordUsernameError = "USERNAME_S_BANNED"| "USERNAME_MISSING" | "USERNAME_TOO_LONG";

export type CanHaveFetchResultError = { error?: FetchResultError | "USERNAME_MISSING"; }
	| { error: "USERNAME_S_BANNED" | "USERNAME_TOO_LONG"; invalidName: string; };

export type HasFetchResultError = { error: FetchResultError | "USERNAME_MISSING"; }
	| { error: "USERNAME_S_BANNED" | "USERNAME_TOO_LONG"; invalidName: string; };

/** Returns true if an error message was sent to the user. */
export async function handleImportErrors(sageCommand: SageCommand, action: "IMPORT" | "REIMPORT", fetchResults: CanHaveFetchResultError[]): Promise<void> {
	if (!fetchResults.length) {
		fetchResults.push({ error:"NOTHING_TO_IMPORT" });
	}

	const localizer = sageCommand.getLocalizer();

	const errorMessages = fetchResults
		.filter((fetchResult: CanHaveFetchResultError): fetchResult is HasFetchResultError => !!fetchResult?.error)
		.map(fetchResult => {
			// make sure the error has a valid localized text before localizing it
			if (hasLocalizedText(fetchResult.error)) {
				if (fetchResult.error === "USERNAME_S_BANNED") {
					return localizer("USERNAME_S_BANNED", fetchResult.invalidName);
				}
				return localizer(fetchResult.error);
			}
			debug({fetchResult});
			return localizer("SORRY_WE_DONT_KNOW");
		});

	if (errorMessages.length) {
		const content = [localizer(`${action}_ERROR`)];
		content.push(...errorMessages);
		content.push(`\n${localizer("IMPORT_CHARACTERS_WIKI")}`);
		await sageCommand.replyStack.whisper(content.join("\n"));
		await sageCommand.replyStack.stopThinking();
	}
}