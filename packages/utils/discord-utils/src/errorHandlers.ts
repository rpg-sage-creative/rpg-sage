import { error, warn } from "@rsc-utils/console-utils";
import { toHumanReadable } from "./toHumanReadable.js";

//#region generic error types

type TRawError = {
	code: number;
	errors: any[];
	message: string;
};

type TDiscordError = {
	code: number;
	method: "GET"|"POST"|"PATCH"|"PUT"|"DELETE",
	rawError: TRawError;
	requestBody: any;
	status: number;
	url: string;
};

//#endregion

//#region "Invalid Form Body"

type TInvalidFormBodyError = TDiscordError & {
	code: 50035;
	method: "POST";
	rawError: TRawError & { code:50035; message:"Invalid Form Body"; };
};

function isInvalidFormBodyError(reason: any): reason is TInvalidFormBodyError {
	return reason.code === 50035;
}
function handleInvalidFormBodyError(reason: any): boolean {
	if (isInvalidFormBodyError(reason)) {
		const stringValue = Object.prototype.toString.call(reason);
		error(stringValue);
		return true;
	}
	return false;
}

//#endregion

//#region DiscordAPIError

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

function isDiscordApiErrorMissingPermissionsFetchWebhook(_reason: any, asString: string): boolean {
	return asString.includes("DiscordAPIError: Missing Permissions")
		&& asString.includes("TextChannel.fetchWebhooks");
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

function handleDiscordApiError(reason: any): boolean {
	if (isDiscordApiError(reason)) {
		const asString = Object.prototype.toString.call(reason);
		if (isDiscordApiErrorMissingPermissionsFetchWebhook(reason, asString)) {
			warn(`DiscordAPIError: Missing Permissions (TextChannel.fetchWebhooks)`);
			return true;
		}
		if (isUnknownMember(reason) || isUnknownGuild(reason) || isUnknownUser(reason)) {
			warn(`${reason.message}: ${reason.path}`);
			return true;
		}
	}
	return false;

}

//#endregion

export function handleDiscordErrorReturnNull(reason: any, options?: { errMsg:any, target:any }): null {
	let handled = false;
	handled ||= handleInvalidFormBodyError(reason);
	handled ||= handleDiscordApiError(reason);
	if (!handled) {
		const output = (options?.target || options?.errMsg)
			? [toHumanReadable(options.target), options.errMsg].filter(s => s).join(": ")
			: Object.prototype.toString.call(reason);
		if (output === "[object Error]") {
			error(reason);
		}else {
			error(output);
		}
	}
	return null;
}
