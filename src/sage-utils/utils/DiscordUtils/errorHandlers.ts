
function isDiscordApiErrorMissingPermissionsFetchWebhook(reason: any): boolean {
	const stringValue = Object.prototype.toString.call(reason);
	return stringValue.includes("DiscordAPIError: Missing Permissions")
		&& stringValue.includes("TextChannel.fetchWebhooks");
}

type TDiscordApiError = {
	name: "DiscordAPIError";
	message: string;
	path: string;
	/** https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes */
	code: number;
	method: "GET"|"POST"|"PATCH"|"PUT"|"DELETE"
};

function isDiscordApiError(reason: any): reason is TDiscordApiError {
	return reason?.name === "DiscordAPIError";
}

function isUnknownGuild(reason: TDiscordApiError): boolean {
	return reason?.message === "Unknown Guild";
}

function isUnknownMember(reason: TDiscordApiError): boolean {
	return reason?.message === "Unknown Member";
}

function isUnknownUser(reason: TDiscordApiError): boolean {
	return reason?.message === "Unknown User";
}

export function warnUnknownElseErrorReturnNull(reason: any): null {
	if (isDiscordApiErrorMissingPermissionsFetchWebhook(reason)) {
		console.warn(`DiscordAPIError: Missing Permissions (TextChannel.fetchWebhooks)`);
	}else {
		if (isDiscordApiError(reason) && (isUnknownMember(reason) || isUnknownGuild(reason) || isUnknownUser(reason))) {
			console.warn(`${reason.message}: ${reason.path}`);
		}else {
			console.error(reason);
		}
	}
	return null;
}